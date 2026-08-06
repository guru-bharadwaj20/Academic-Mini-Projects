#!/bin/bash
echo "Pulse-Chat Certificate Generation"
echo

if ! command -v openssl &> /dev/null; then
    echo "ERROR: OpenSSL is not installed."
    echo "Please install OpenSSL and try again."
    exit 1
fi

COUNTRY="IN"
STATE="Karnataka"
CITY="Bangalore"
ORG="Pulse-Chat"
UNIT="Development"
CN="localhost"
DAYS=365

# Write next to this script, so it does not matter what directory the
# script is invoked from.
cd "$(dirname "$0")" || exit 1

# Git Bash / MSYS2 on Windows rewrites any argument that looks like an
# absolute POSIX path, so -subj "/C=IN/ST=..." arrived at openssl as
# "C:/Program Files/Git/C=IN/ST=..." and the command failed. Harmless
# elsewhere.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

echo "Generating private key and self-signed certificate..."
echo

# subjectAltName is REQUIRED. Python's ssl module (3.7+) and every modern
# TLS stack ignore the legacy CN field when matching a hostname, so a
# CN-only certificate can never be verified - which is why the client had
# had to disable verification entirely to connect at all.
openssl req -x509 -newkey rsa:2048 \
    -keyout server.key \
    -out server.crt \
    -days $DAYS \
    -nodes \
    -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/OU=$UNIT/CN=$CN" \
    -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1,IP:::1" \
    -addext "basicConstraints=critical,CA:TRUE" \
    -addext "keyUsage=critical,digitalSignature,keyCertSign"

if [ $? -eq 0 ]; then
    echo
    echo "✓ Certificates generated successfully!"
    echo
    echo "Files created:"
    echo "  - server.key (Private Key)"
    echo "  - server.crt (Certificate)"
    echo
    echo "Certificate valid for $DAYS days"
    echo
    echo "Certificate Information:"
    echo "------------------------"
    openssl x509 -in server.crt -noout -subject -dates
    echo
    echo "Subject Alternative Names (required for hostname verification):"
    openssl x509 -in server.crt -noout -ext subjectAltName
    echo

   
    chmod 600 server.key
    chmod 644 server.crt
    echo "Permissions set: server.key - Private, server.crt -Public"
    
else
    echo
    echo "Error generating certificates"
    exit 1
fi

echo "You can now start the server!"
