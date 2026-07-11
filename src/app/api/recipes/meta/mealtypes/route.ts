import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ mealTypes: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] })
}
