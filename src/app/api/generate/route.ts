import { NextResponse, NextRequest } from "next/server";
import { DEFAULT_MODEL, sunoApi } from "@/lib/SunoApi";
import { corsHeaders } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (req.method === 'POST') {
    try {
      const body = await req.clone().json();
      const { prompt, make_instrumental, model, wait_audio } = body;

      let sunoApiGot = (await sunoApi).getSunoApi()

      console.info("Connected to " + sunoApiGot.self_index + " Suno Api")

      const audioInfo = await sunoApiGot.generate(
        prompt,
        Boolean(make_instrumental),
        model || DEFAULT_MODEL,
        Boolean(wait_audio)
      );

      return new NextResponse(JSON.stringify(audioInfo), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error: any) {
      console.error('Error generating custom audio:', JSON.stringify(error.response.data));
      if (error.response.statusText === "Payment Required") {
        if ( await (await sunoApi).changeClient() ) {
          console.info("Client switched to " + (process.env.SUNO_INDEX || "_"))
          let resp = await POST(req)
          return resp
        } 
      }
      if (error.response.status === 402) {
        return new NextResponse(JSON.stringify({ error: error.response.data.detail }), {
          status: 402,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      return new NextResponse(JSON.stringify({ error: 'Internal server error: ' + JSON.stringify(error.response.data.detail) }), {
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
        Allow: 'POST',
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