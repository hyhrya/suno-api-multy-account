import { NextResponse, NextRequest } from "next/server";
import { sunoApi } from "@/lib/SunoApi";
import { corsHeaders } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const songIds = url.searchParams.get('ids');
      let audioInfo = [];
      let sunoApiGot = (await sunoApi).getSunoApi()

      console.info("Connected to " + sunoApiGot.self_index + " Suno Api")

      if (songIds && songIds.length > 0) {
        const idsArray = songIds.split(',');
        audioInfo = await (sunoApiGot).get(idsArray);
      } else {
        audioInfo = await (sunoApiGot).get();
      }

      return new NextResponse(JSON.stringify(audioInfo), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error: any) {
      console.error('Error fetching audio:', error);

      
      if (error.response.statusText === "Payment Required") {
        if ( await (await sunoApi).changeClient() ) {
          return await GET(req)
        } 
      }

      return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  } else {
    return new NextResponse('Method Not Allowed', {
      headers: {
        Allow: 'GET',
        ...corsHeaders
      },
      status: 405
    });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}