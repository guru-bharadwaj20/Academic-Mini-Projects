`timescale 1ns / 1ps

module tb;

    reg clk;
    reg rst;
    reg start;
    reg [3:0] multiplicand;
    reg [3:0] multiplier;
    wire [7:0] product;
    wire done;

    integer errors;
    integer checks;
    integer a, b;

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

    initial begin
        clk = 0;
        forever #5 clk = ~clk;
    end

    // Drive one multiplication and check the result against the expected
    // product. Previously the bench exercised a single hand-picked pair
    // (3*2), which happened to be one of the 204 cases the buggy 4-bit
    // accumulator got right - so the carry bug went unnoticed.
    task run_case(input [3:0] mcand, input [3:0] mplier);
        reg [7:0] expected;
        begin
            expected = mcand * mplier;

            @(negedge clk);
            multiplicand = mcand;
            multiplier   = mplier;
            start        = 1'b1;

            @(negedge clk);
            start = 1'b0;

            wait (done === 1'b1);
            @(negedge clk);

            checks = checks + 1;
            if (product !== expected) begin
                errors = errors + 1;
                $display("FAIL: %0d * %0d -> got %0d, expected %0d",
                         mcand, mplier, product, expected);
            end
        end
    endtask

    initial begin
        errors  = 0;
        checks  = 0;
        rst     = 1;
        start   = 0;
        multiplicand = 0;
        multiplier   = 0;

        #12 rst = 0;

        // Exhaustive sweep: every 4x4 input pair.
        for (a = 0; a < 16; a = a + 1) begin
            for (b = 0; b < 16; b = b + 1) begin
                run_case(a[3:0], b[3:0]);
            end
        end

        $display("");
        $display("========================================");
        $display(" Exhaustive 4x4 multiplier check");
        $display(" checked : %0d", checks);
        $display(" failures: %0d", errors);
        if (errors == 0)
            $display(" RESULT  : PASS");
        else
            $display(" RESULT  : FAIL");
        $display("========================================");

        $finish;
    end

    // Safety net: never hang if `done` is not asserted.
    initial begin
        #500000;
        $display("TIMEOUT: done was never asserted");
        $finish;
    end

endmodule
