// app/api/places/meta/route.ts (Next.js App Router example)
import { NextResponse } from 'next/server';
// Import your database connection and Place model here
// import dbConnect from '@/lib/dbConnect';
// import Place from '@/models/Place';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');

  if (!city) {
    return NextResponse.json({ error: 'City is required' }, { status: 400 });
  }

  // Clean the city name (e.g., "Paris, France" -> "Paris") for better Wiki results
  const cleanCity = city.split(',')[0].trim();

  try {
    // await dbConnect();
    
    // 1. Check your database first
    // let placeMeta = await Place.findOne({ name: cleanCity });
    
    // if (placeMeta) {
    //   return NextResponse.json(placeMeta);
    // }

    // 2. If not in DB, fetch from Wikipedia API
    const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanCity)}`);
    
    if (!wikiRes.ok) {
      throw new Error('Wikipedia API failed');
    }

    const wikiData = await wikiRes.json();

    // Extract sentences to formulate a "Fun Fact" (grabbing the second or last sentence)
    const sentences = wikiData.extract ? wikiData.extract.split('. ').filter(Boolean) : [];
    const funFact = sentences.length > 1 ? `${sentences[1]}.` : "Local culture and history run deep here.";

    const newPlaceData = {
      name: cleanCity,
      description: wikiData.extract || "A beautiful destination waiting to be explored.",
      imageUrl: wikiData.originalimage?.source || wikiData.thumbnail?.source || null,
      funFact: funFact
    };

    // 3. Save to your database to accumulate data over time
    // await Place.create(newPlaceData);

    return NextResponse.json(newPlaceData);

  } catch (error) {
    console.error("Meta fetch error:", error);
    return NextResponse.json({ 
      description: "Get ready for an unforgettable journey.", 
      funFact: "Adventure awaits around every corner." 
    }, { status: 200 }); // Graceful fallback
  }
}