<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function process(Request $request)
    {
        $request->validate([
            'amount'   => 'required|numeric|min:1',
            'order_id' => 'required|string',
        ]);

        return response()->json([
            'status'   => 'pending',
            'order_id' => $request->order_id,
            'amount'   => $request->amount,
        ]);
    }
}
