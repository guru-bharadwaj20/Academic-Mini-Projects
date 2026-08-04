import os
import re

from lexer import lexer

# Import the MODULE, not just the parser object. `last_error` is a
# module-level global set by p_error(); reading it off the LRParser instance
# (getattr(parser, 'last_error', None)) always returned None, so every
# rejection fell through to the generic message and the line number, token
# name and source echo were unreachable.
import parser as grammar

def parse_snippet(code: str, snippet_index: int):
    """Feed a code snippet to the lexer and parser and print results."""
    if not code or not code.strip():
        print(f"\nSkipping empty snippet #{snippet_index}")
        return

    print(f"\nParsing snippet #{snippet_index}")
    try:
        lexer.lineno = 1
    except Exception:
        pass

    # Clear any error left over from the previous snippet, so a rejection
    # can never be reported with a stale message.
    grammar.last_error = None

    lexer.input(code)
    parsed = grammar.parser.parse(code)

    if parsed is not None:
        print("Accepted")
    else:
        err = grammar.last_error
        if isinstance(err, dict):
            lineno = err.get('lineno')
            msg = err.get('message')
            print(f"Rejected: {msg}")
            if lineno is not None:
                try:
                    lines = code.splitlines()
                    if 1 <= lineno <= len(lines):
                        bad_line = lines[lineno-1]
                        print(f"At line {lineno}: {bad_line}")
                except Exception:
                    pass
        else:
            print("Rejected: Syntax error")


def main():
    print("Reading input snippets from 'input.txt' in the same directory as main.py")

    txt_path = os.path.join(os.path.dirname(__file__), 'input.txt')
    if not os.path.exists(txt_path):
        print(f"TXT file not found: {txt_path}")
        return

    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split snippets separated by one or more blank lines
    snippets = [s.strip() for s in re.split(r'\r?\n\s*\r?\n', content.strip()) if s.strip()]

    if not snippets:
        print("No snippets found in input.txt")
        return

    for idx, s in enumerate(snippets, start=1):
        parse_snippet(s, idx)


if __name__ == '__main__':
    main()