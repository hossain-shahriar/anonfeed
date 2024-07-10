import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const filePath = path.join(process.cwd(), 'src', 'suggestFeeds.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const questionsData = JSON.parse(jsonData);

    const questions = questionsData.questions;
    if (!questions || questions.length < 3) {
      return NextResponse.json(
        { message: 'Not enough questions in the file' },
        { status: 500 }
      );
    }

    // Shuffle the questions array
    const shuffledQuestions = questions.sort(() => 0.5 - Math.random());

    // Get three random questions
    const selectedQuestions = shuffledQuestions.slice(0, 3).join('||');

    return NextResponse.json({ suggestions: selectedQuestions });
  } catch (error) {
    console.error('Error reading questions file:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
