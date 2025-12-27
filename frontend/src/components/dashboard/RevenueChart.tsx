"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IndianRupee } from "lucide-react"

export function RevenueChart() {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Fee Collection Overview</CardTitle>
                <CardDescription>Monthly revenue breakdown for the current academic year.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px] w-full flex flex-col items-center justify-center text-center">
                    <IndianRupee className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">Fee Collection Analytics Coming Soon</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        This chart will display monthly fee collection data once the fee management
                        system is fully integrated.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

