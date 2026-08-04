module sequential_multiplier(
    input clk,
    input rst,
    input start,
    input [3:0] multiplicand,
    input [3:0] multiplier,
    output [7:0] product,
    output reg done
);

    localparam IDLE = 2'b00;
    localparam MULT_ADD = 2'b01;
    localparam MULT_SHIFT = 2'b10;
    localparam DONE = 2'b11;

    reg [1:0] state;
    reg [3:0] B_reg;
    reg [2:0] count;

    // Shift-and-add accumulator, 9 bits wide:
    //   acc[8:4] - 5-bit running sum (4 data bits + 1 carry bit)
    //   acc[3:0] - remaining multiplier bits, consumed LSB first
    //
    // The upper half MUST be 5 bits. A 4-bit accumulator drops the carry
    // out of "partial sum + multiplicand", which silently corrupts any
    // product where an intermediate sum exceeds 15 (52 of the 256 input
    // pairs, e.g. 15*15 returned 1 instead of 225).
    reg [8:0] acc;

    assign product = acc[7:0];

    always @(posedge clk or posedge rst) begin
        if (rst) begin
            state <= IDLE;
            acc <= 9'b0;
            B_reg <= 4'b0;
            count <= 3'b0;
            done <= 1'b0;
        end else begin
            case (state)
                IDLE: begin
                    done <= 1'b0;
                    if (start) begin
                        acc <= {5'b0, multiplier};
                        B_reg <= multiplicand;
                        count <= 4;
                        state <= MULT_ADD;
                    end
                end

                MULT_ADD: begin
                    if (acc[0]) begin
                        // 5-bit destination, so the carry out of the
                        // 4-bit addition is retained rather than lost.
                        acc[8:4] <= acc[8:4] + B_reg;
                    end
                    state <= MULT_SHIFT;
                end

                MULT_SHIFT: begin
                    acc <= acc >> 1;
                    count <= count - 1;
                    if (count == 1) begin
                        state <= DONE;
                    end else begin
                        state <= MULT_ADD;
                    end
                end

                DONE: begin
                    done <= 1'b1;
                    if (!start) begin
                        state <= IDLE;
                    end
                end
            endcase
        end
    end

endmodule
