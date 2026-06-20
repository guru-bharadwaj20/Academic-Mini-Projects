module sequential_multiplier(
    input clk,
    input rst,
    input start,
    input [3:0] multiplicand,
    input [3:0] multiplier,
    output reg [7:0] product,
    output reg done
);

    localparam IDLE = 2'b00;
    localparam MULT_ADD = 2'b01;
    localparam MULT_SHIFT = 2'b10;
    localparam DONE = 2'b11;

    reg [1:0] state;
    reg [3:0] B_reg;
    reg [2:0] count;

    always @(posedge clk or posedge rst) begin
        if (rst) begin
            state <= IDLE;
            product <= 8'b0;
            B_reg <= 4'b0;
            count <= 3'b0;
            done <= 1'b0;
        end else begin
            case (state)
                IDLE: begin
                    done <= 1'b0;
                    if (start) begin
                        product <= {4'b0, multiplier};
                        B_reg <= multiplicand;
                        count <= 4;
                        state <= MULT_ADD;
                    end
                end
                
                MULT_ADD: begin
                    if (product[0]) begin
                        product[7:4] <= product[7:4] + B_reg;
                    end
                    state <= MULT_SHIFT;
                end
                
                MULT_SHIFT: begin
                    product <= product >> 1;
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