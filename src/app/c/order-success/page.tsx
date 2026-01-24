'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function OrderSuccessPage() {
    return (
        <div className="container mx-auto p-4 sm:p-8 text-center">
            <div className="py-20 max-w-md mx-auto">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <h1 className="mt-6 text-3xl font-headline font-bold">Order Placed Successfully!</h1>
                <p className="mt-2 text-muted-foreground">
                    Thank you for your order. You can track its status in your order history.
                    (Order history feature coming soon!)
                </p>
                <Button asChild className="mt-8">
                    <Link href="/c/home">Continue Browsing</Link>
                </Button>
            </div>
        </div>
    );
}
