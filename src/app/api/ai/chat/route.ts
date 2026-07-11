import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()

    const GEMINI_KEY = process.env.GEMINI_API_KEY

    if (!GEMINI_KEY) {
      const fallbacks: Record<string, string> = {
        default: "Great question! For fitness advice: focus on compound movements (squats, deadlifts, bench press), eat 1g protein per pound of bodyweight, get 7-9 hours sleep, and stay consistent. What specific goal are you working towards?",
        squat: "For squats: feet shoulder-width, toes slightly out, chest up, drive knees over toes, go to parallel or below. Start with bodyweight, then add weight progressively.",
        protein: "Aim for 1.6-2.2g of protein per kg of bodyweight daily. Good sources: chicken, fish, eggs, lentils (daal), Greek yogurt, paneer. Spread intake across 3-5 meals.",
        lose: "For fat loss: create a 300-500 calorie deficit, prioritize protein (preserves muscle), do a mix of strength training and cardio, track your food, and be patient — aim for 0.5-1kg per week.",
      }
      const lower = message.toLowerCase()
      const reply = lower.includes('squat') ? fallbacks.squat
        : lower.includes('protein') ? fallbacks.protein
        : lower.includes('lose') || lower.includes('fat') ? fallbacks.lose
        : fallbacks.default
      return NextResponse.json({ reply })
    }

    const conversationHistory = (history || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: `You are a professional fitness and nutrition coach for T.E.S.T. — a Pakistani fitness platform.
              Answer questions about: exercise form, workout plans, nutrition, weight loss, muscle gain, recovery, and healthy habits.
              Keep answers concise (2-4 sentences), practical, and encouraging.
              Use Pakistani food examples when discussing nutrition (chicken biryani, daal, roti, etc.)
              Do NOT answer questions unrelated to fitness, health, or nutrition.
              Do NOT provide medical diagnoses. Always suggest consulting a doctor for medical concerns.`
            }]
          },
          contents: [...conversationHistory, { role: 'user', parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
        })
      }
    )

    const data = await res.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response. Please try again.'
    return NextResponse.json({ reply })

  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ reply: 'AI service temporarily unavailable. Please try again shortly.' })
  }
}
