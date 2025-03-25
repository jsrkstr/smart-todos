import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { title, description } = await request.json()

    const prompt = `Break down this task into 4-6 logical subtasks that would help complete it effectively:
Task: ${title}
${description ? `Additional context: ${description}` : ''}

Return only the subtasks as a numbered list, with each subtask being clear and actionable.`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a task management assistant that helps break down tasks into logical subtasks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const response = completion.choices[0].message.content || ''
    const subtasks = response
      .split('\n')
      .filter(line => line.trim().match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())

    return NextResponse.json({ subtasks })
  } catch (error) {
    console.error('Error generating subtasks:', error)
    return NextResponse.json(
      { error: 'Failed to generate subtasks' },
      { status: 500 }
    )
  }
} 