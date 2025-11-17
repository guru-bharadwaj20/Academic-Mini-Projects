import ply.yacc as yacc
from lexer import tokens

# structured last error info set by p_error
last_error = None

precedence = (
    ('right', 'EQUALS'),
    ('left', 'OR'),
    ('left', 'AND'),
    ('left', 'EQ', 'NEQ'),
    ('left', 'LT', 'LTE', 'GT', 'GTE'),
    ('left', 'PLUS', 'MINUS'),
    ('left', 'TIMES', 'DIVIDE'),
    ('right', 'NOT', 'UMINUS'),
    ('right', 'PLUSPLUS', 'MINUSMINUS'),
    ('left', 'LPAREN', 'RPAREN', 'LBRACKET', 'RBRACKET'),
)

def p_program(p):
    'program : statements'
    p[0] = ('program', p[1])

def p_statements(p):
    '''statements : statement
                  | statement statements'''
    if len(p) == 2:
        p[0] = [p[1]]
    else:
        p[0] = [p[1]] + p[2]

def p_statement(p):
    '''statement : function_declaration
                 | while_loop
                 | if_else_statement
                 | for_loop
                 | array_declaration
                 | return_statement
                 | expression_statement'''
    p[0] = p[1]

def p_expression_statement(p):
    'expression_statement : expression SEMICOLON'
    p[0] = ('expression_statement', p[1])

def p_return_statement(p):
    'return_statement : RETURN expression SEMICOLON'
    p[0] = ('return', p[2])

def p_type(p):
    '''type : INT
            | VOID
            | STRING'''
    p[0] = p[1]

def p_function_declaration(p):
    'function_declaration : type ID LPAREN param_list RPAREN LBRACE statements RBRACE'
    p[0] = ('function_decl', p[1], p[2], p[4], p[7])

def p_param_list(p):
    '''param_list : param
                  | param COMMA param_list
                  | empty'''
    if len(p) == 2:
        p[0] = [p[1]]
    elif len(p) == 4:
        p[0] = [p[1]] + p[3]
    else:
        p[0] = []

def p_param(p):
    'param : type ID'
    p[0] = ('param', p[1], p[2])

def p_while_loop(p):
    'while_loop : WHILE LPAREN expression RPAREN LBRACE statements RBRACE'
    p[0] = ('while_loop', p[3], p[6])

def p_if_else_statement(p):
    '''if_else_statement : IF LPAREN expression RPAREN LBRACE statements RBRACE
                         | IF LPAREN expression RPAREN LBRACE statements RBRACE ELSE LBRACE statements RBRACE'''
    if len(p) == 8:
        p[0] = ('if_statement', p[3], p[6])
    else:
        p[0] = ('if_else_statement', p[3], p[6], p[10])

def p_for_loop(p):
    'for_loop : FOR LPAREN optional_expression SEMICOLON optional_expression SEMICOLON optional_expression RPAREN LBRACE statements RBRACE'
    p[0] = ('for_loop', p[3], p[5], p[7], p[10])

def p_optional_expression(p):
    '''optional_expression : expression
                           | empty'''
    p[0] = p[1] if len(p) == 2 else None

def p_array_declaration(p):
    '''array_declaration : type ID LBRACKET RBRACKET SEMICOLON
                         | type ID LBRACKET expression RBRACKET SEMICOLON'''
    if len(p) == 6:
        p[0] = ('array_declaration', p[1], p[2])
    else:
        p[0] = ('array_declaration_sized', p[1], p[2], p[4])

def p_expression_binop(p):
    '''expression : expression PLUS expression
                  | expression MINUS expression
                  | expression TIMES expression
                  | expression DIVIDE expression
                  | expression LT expression
                  | expression GT expression
                  | expression LTE expression
                  | expression GTE expression
                  | expression EQ expression
                  | expression NEQ expression
                  | expression AND expression
                  | expression OR expression
                  | expression EQUALS expression'''
    p[0] = (p[2], p[1], p[3])

def p_expression_unary(p):
    '''expression : NOT expression
                  | MINUS expression %prec UMINUS'''
    p[0] = (p[1], p[2])

def p_expression_increment(p):
    '''expression : ID PLUSPLUS
                  | ID MINUSMINUS'''
    p[0] = ('post_increment' if p[2] == '++' else 'post_decrement', p[1])

def p_expression_group(p):
    'expression : LPAREN expression RPAREN'
    p[0] = p[2]

def p_expression_func_call(p):
    'expression : ID LPAREN arg_list RPAREN'
    p[0] = ('function_call', p[1], p[3])

def p_expression_array_access(p):
    'expression : ID LBRACKET expression RBRACKET'
    p[0] = ('array_access', p[1], p[3])

def p_expression_terminals(p):
    '''expression : ID
                  | NUMBER'''
    p[0] = p[1]

def p_arg_list(p):
    '''arg_list : expression
                | expression COMMA arg_list
                | empty'''
    if len(p) == 2:
        p[0] = [p[1]]
    elif len(p) == 4:
        p[0] = [p[1]] + p[3]
    else:
        p[0] = []

def p_empty(p):
    'empty :'
    pass

def p_error(p):
    global last_error
    if p:
        lineno = getattr(p, 'lineno', None)
        last_error = {
            'message': f"Syntax error at token {p.type!r} with value {p.value!r} on line {lineno}",
            'token': p.type,
            'value': p.value,
            'lineno': lineno,
        }
    else:
        last_error = {
            'message': 'Syntax error at EOF or empty input',
            'token': None,
            'value': None,
            'lineno': None,
        }

parser = yacc.yacc()