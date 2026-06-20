module tb;

    reg clk;
    reg rst;
    reg start;
    reg [3:0] multiplicand;
    reg [3:0] multiplier;
    wire [7:0] product;
    wire done;

    sequential_multiplier uut (
        .clk(clk),
        .rst(rst),
        .start(start),
        .multiplicand(multiplicand),
        .multiplier(multiplier),
        .product(product),
        .done(done)
    );

    initial begin
        $dumpfile("multiplier.vcd");
        $dumpvars(0, tb);
    end

    always #5 clk = ~clk;

    initial begin
        $monitor($time, " clk=%b, rst=%b, start=%b | multiplicand=%d, multiplier=%d | product=%d, done=%b",
                 clk, rst, start, multiplicand, multiplier, product, done);
    end

    initial begin
        clk = 0;
        rst = 1;
        start = 0;
        multiplicand = 0;
        multiplier = 0;
        
        #10 rst = 0;
        
        #10 multiplicand = 4'd3;
            multiplier = 4'd2;
            start = 1'b1;
        #10 start = 1'b0;
        
        wait (done);
        #10;
        
        $finish;
    end

endmodule