"""
Chat Server Module

This is the main server implementation that:
1. Creates a TCP socket and binds to a port
2. Wraps the socket with SSL/TLS for secure communication
3. Accepts incoming client connections
4. Spawns a ClientHandler thread for each client
5. Manages broadcasting messages to all connected clients

Key Networking Concepts:
- TCP Socket: Reliable, connection-oriented communication
- SSL/TLS: Encrypts data in transit AND authenticates the server. The client
  pins the server's self-signed certificate and verifies the hostname against
  its subjectAltName; without that the connection is encrypted but
  unauthenticated, which is what a MITM needs.
- Server Socket: Listens for incoming connections (accept)
- Thread Safety: Uses locks to protect shared data structures
"""

import socket
import ssl
import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict, List, Optional
from server.client_handler import ClientHandler
from server.chat_database import ChatDatabase
from utils.message_protocol import MessageProtocol


class ChatServer:
    """
    Secure multi-client chat server using SSL/TLS over TCP.
    """

    # Failed-authentication throttling. Without this, password guessing was
    # completely unbounded: a wrong password just closed the connection, and
    # the attacker reconnected immediately.
    AUTH_MAX_FAILURES = 5      # per source address
    AUTH_WINDOW_SECONDS = 60   # sliding window the failures are counted over
    AUTH_LOCKOUT_SECONDS = 60  # how long a tripped address stays blocked

    def __init__(
        self,
        host: str = '0.0.0.0',
        port: int = 5555,
        cert_file: str = 'certs/server.crt',
        key_file: str = 'certs/server.key'
    ):
        """
        Initialize the chat server.
        
        Args:
            host: IP address to bind to (0.0.0.0 = all interfaces)
            port: Port number to listen on
            cert_file: Path to the SSL certificate file
            key_file: Path to the SSL private key file
        """
        self.host = host
        self.port = port
        self.cert_file = cert_file
        self.key_file = key_file
        self.database = ChatDatabase()
        
        # List of connected clients - needs thread-safe access
        self.clients: List[ClientHandler] = []
        # Lock for thread-safe access to the clients list
        self.clients_lock = threading.Lock()
        
        # Server state
        self.running = False
        self.server_socket: Optional[socket.socket] = None
        self.active_users: Dict[str, ClientHandler] = {}
        self.active_rooms = defaultdict(set)

        # Sliding window of failed auth timestamps, keyed by source IP.
        self.auth_failures: Dict[str, Deque[float]] = defaultdict(deque)
        self.auth_lock = threading.Lock()
    
    def start(self):
        """
        Start the chat server.
        
        This method:
        1. Creates a TCP socket
        2. Wraps it with SSL/TLS
        3. Binds to the specified address and port
        4. Listens for incoming connections
        5. Accepts and handles clients in a loop
        """
        try:
            # Step 1: Create a TCP socket
            # AF_INET = IPv4, SOCK_STREAM = TCP
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            
            # Allow reusing the address immediately after server shutdown
            # Prevents "Address already in use" errors
            self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            
            # Step 2: Bind the socket to an address and port
            # This associates the socket with a specific network interface and port
            self.server_socket.bind((self.host, self.port))
            
            # Step 3: Create an SSL context for secure communication
            # This configures the TLS settings
            ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            
            # Load the server's certificate and private key
            # Certificate proves server's identity to clients
            ssl_context.load_cert_chain(
                certfile=self.cert_file,
                keyfile=self.key_file
            )
            
            # Step 4: Wrap the server socket with SSL
            # All accepted connections will automatically use TLS
            secure_socket = ssl_context.wrap_socket(
                self.server_socket,
                server_side=True
            )
            
            # Step 5: Listen for incoming connections
            # Backlog of 5 means up to 5 pending connections can wait
            secure_socket.listen(5)
            
            self.running = True
            print(f"[SERVER] Secure chat server started on {self.host}:{self.port}")
            print(f"[SERVER] Using certificate: {self.cert_file}")
            print(f"[SERVER] Waiting for connections...\n")
            
            # Main server loop - accept clients
            while self.running:
                try:
                    # Accept a new client connection
                    # This blocks until a client connects
                    # The TLS handshake happens automatically here
                    client_socket, client_address = secure_socket.accept()
                    
                    print(f"[SERVER] New connection from {client_address}")
                    
                    # Create a handler for this client
                    client_handler = ClientHandler(
                        client_socket=client_socket,
                        client_address=client_address,
                        broadcast_callback=self.broadcast_message,
                        direct_message_callback=self.send_direct_message,
                        remove_callback=self.remove_client,
                        auth_callback=self.authenticate_client,
                        room_join_callback=self.join_room,
                        room_list_callback=self.list_rooms,
                        history_callback=self.get_recent_history,
                        user_list_callback=self.list_active_users,
                        user_list_broadcast_callback=self.broadcast_user_list
                    )
                    
                    # Add to clients list (thread-safe)
                    with self.clients_lock:
                        self.clients.append(client_handler)
                    
                    # Start the handler thread
                    client_handler.start()
                
                except ssl.SSLError as e:
                    print(f"[SERVER] SSL Error: {e}")
                except OSError:
                    # Socket closed, server stopping
                    if self.running:
                        raise
                    break
        
        except KeyboardInterrupt:
            print("\n[SERVER] Shutting down...")
        except FileNotFoundError as e:
            print(f"[SERVER] Certificate files not found: {e}")
            print("[SERVER] Please generate certificates first (see README.md)")
        except Exception as e:
            print(f"[SERVER] Error: {e}")
        finally:
            self.stop()
    
    def _auth_source(self, client: ClientHandler) -> str:
        """Source address used as the throttling key."""
        try:
            return str(client.address[0])
        except (TypeError, IndexError):
            return "unknown"

    def _auth_blocked_for(self, source: str) -> float:
        """Seconds remaining before `source` may attempt auth again (0 if allowed)."""
        now = time.monotonic()
        with self.auth_lock:
            window = self.auth_failures[source]
            while window and now - window[0] > self.AUTH_WINDOW_SECONDS:
                window.popleft()
            if len(window) >= self.AUTH_MAX_FAILURES:
                remaining = self.AUTH_LOCKOUT_SECONDS - (now - window[-1])
                if remaining > 0:
                    return remaining
                window.clear()
        return 0.0

    def _record_auth_failure(self, source: str):
        with self.auth_lock:
            self.auth_failures[source].append(time.monotonic())

    def _clear_auth_failures(self, source: str):
        with self.auth_lock:
            self.auth_failures.pop(source, None)

    def authenticate_client(
        self,
        client: ClientHandler,
        username: str,
        password: str,
        register: bool = False
    ) -> Dict[str, str]:
        if not username:
            return {"ok": False, "error": "Username cannot be empty."}
        if not password:
            return {"ok": False, "error": "Password cannot be empty."}

        source = self._auth_source(client)
        blocked_for = self._auth_blocked_for(source)
        if blocked_for > 0:
            return {
                "ok": False,
                "error": (
                    "Too many failed sign-in attempts. "
                    f"Try again in {int(blocked_for) + 1}s."
                ),
            }

        # `register` must be requested explicitly. Previously an unknown
        # username was created on the spot, so a typo silently made a new
        # account and anyone could farm arbitrary identities.
        auth_result = self.database.register_or_login(username, password, allow_register=register)
        status = auth_result["status"]

        if status in ("invalid_password", "no_such_user"):
            self._record_auth_failure(source)
            # Deliberately identical wording for both cases, so a failed
            # attempt does not reveal whether the account exists.
            return {"ok": False, "error": "Invalid username or password."}

        if status == "already_exists":
            self._record_auth_failure(source)
            return {"ok": False, "error": f"User '{username}' already exists. Sign in instead."}

        self._clear_auth_failures(source)

        # Session state is only revealed AFTER the credentials are proven.
        # This check used to run before the password was verified, so an
        # unauthenticated attacker could enumerate which accounts were
        # currently online just by trying names.
        #
        # Check-and-claim happens under a single lock acquisition so two
        # simultaneous logins for the same account cannot both succeed.
        with self.clients_lock:
            existing_client = self.active_users.get(username)
            if existing_client and existing_client is not client and existing_client.running:
                return {"ok": False, "error": f"User '{username}' is already logged in."}
            self.active_users[username] = client
            self.active_rooms["lobby"].add(client)

        self.broadcast_user_list()

        status_message = (
            "Account created and logged in."
            if auth_result["status"] == "registered"
            else "Login successful."
        )
        return {
            "ok": True,
            "username": username,
            "room": "lobby",
            "message": status_message
        }

    def join_room(self, client: ClientHandler, room_name: str) -> Dict[str, str]:
        room_name = room_name.strip().lower()
        if not room_name:
            return {"ok": False, "error": "Room name cannot be empty."}

        previous_room = client.current_room
        self.database.ensure_room(room_name, client.username or "system")

        with self.clients_lock:
            if previous_room in self.active_rooms:
                self.active_rooms[previous_room].discard(client)
            self.active_rooms[room_name].add(client)
            client.current_room = room_name

        return {
            "ok": True,
            "message": f"Joined room '{room_name}'.",
            "previous_room": previous_room,
            "room": room_name
        }

    def list_rooms(self) -> List[str]:
        return self.database.list_rooms()

    def list_active_users(self) -> List[str]:
        with self.clients_lock:
            return sorted(
                username
                for username, client in self.active_users.items()
                if client.running
            )

    def get_recent_history(self, room_name: str):
        return self.database.get_recent_messages(room_name)

    def broadcast_user_list(self):
        user_list_message = MessageProtocol.create_message(
            MessageProtocol.TYPE_USER_LIST,
            "system",
            "Online users updated",
            users=self.list_active_users()
        )
        self.broadcast_message(user_list_message)

    def send_direct_message(self, recipient: str, message: dict) -> Dict[str, str]:
        recipient = (recipient or "").strip()
        if not recipient:
            return {"ok": False, "error": "Recipient username is required."}

        with self.clients_lock:
            target_client = self.active_users.get(recipient)

        if not target_client or not target_client.running:
            return {"ok": False, "error": f"User '{recipient}' is not online."}

        if not target_client.send_message(message):
            self.remove_client(target_client)
            self.broadcast_user_list()
            return {"ok": False, "error": f"User '{recipient}' is no longer reachable."}

        return {"ok": True}

    def broadcast_message(
        self,
        message: dict,
        exclude: Optional[ClientHandler] = None,
        room: Optional[str] = None
    ):
        """
        Broadcast a message to all connected clients.
        
        This is thread-safe and can be called from any client handler thread.
        
        Args:
            message: Message dictionary to broadcast
            exclude: Optional client to exclude from broadcast (e.g., the sender)
        """
        # Use lock to safely iterate over clients list
        # Multiple threads might be adding/removing clients simultaneously
        room_name = room or message.get("room")
        if message.get("type") == MessageProtocol.TYPE_CHAT and room_name:
            self.database.save_message(
                room_name=room_name,
                username=message.get("username", "Unknown"),
                message_type=message.get("type", MessageProtocol.TYPE_CHAT),
                content=message.get("content", ""),
                timestamp=message.get("timestamp", "")
            )

        with self.clients_lock:
            target_clients = (
                list(self.active_rooms.get(room_name, set()))
                if room_name else list(self.clients)
            )

        disconnected_clients = []
        for client in target_clients:
            # Skip the excluded client if specified
            if client == exclude:
                continue
            if not client.send_message(message):
                disconnected_clients.append(client)

        for client in disconnected_clients:
            self.remove_client(client)
    
    def remove_client(self, client: ClientHandler):
        """
        Remove a client from the active clients list.
        Called when a client disconnects.
        
        Args:
            client: ClientHandler instance to remove
        """
        with self.clients_lock:
            removed_user = False
            if client in self.clients:
                self.clients.remove(client)
            if client.username and self.active_users.get(client.username) is client:
                del self.active_users[client.username]
                removed_user = True

            # Discard from EVERY room, not just current_room, and delete rooms
            # once they are empty. active_rooms is a defaultdict that was only
            # ever added to, so it grew a permanent entry for every room ever
            # visited, each still holding references to dead handlers.
            for room_name in list(self.active_rooms.keys()):
                members = self.active_rooms[room_name]
                members.discard(client)
                if not members:
                    del self.active_rooms[room_name]

            # This log used to sit inside the `if current_room in active_rooms`
            # block, so it only fired some of the time.
            print(f"[SERVER] Removed client. Active clients: {len(self.clients)}")

        if removed_user:
            self.broadcast_user_list()
    
    def stop(self):
        """
        Stop the server and clean up resources.
        """
        self.running = False
        
        # Close all client connections
        with self.clients_lock:
            for client in self.clients:
                try:
                    client.socket.close()
                except:
                    pass
            self.clients.clear()
        
        # Close the server socket
        if self.server_socket:
            try:
                self.server_socket.close()
            except:
                pass
        
        print("[SERVER] Server stopped")


if __name__ == "__main__":
    # Allow running this module directly for testing
    server = ChatServer()
    server.start()
