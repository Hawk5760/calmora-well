// supabase/functions/totp/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticator } from "https://esm.sh/otplib@12.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string | undefined;

    if (action === "generate") {
      const secret = authenticator.generateSecret();
      const issuer = "Calmora";
      const label = `${issuer}:${user.email ?? user.id}`;
      const otpauthUrl = authenticator.keyuri(label, issuer, secret);

      // generate 8 backup codes
      const backup_codes = Array.from({ length: 8 }, () => crypto.randomUUID().replace(/-/g, "").slice(0, 10));

      // upsert secret (disabled until verified)
      const { error: upsertError } = await supabase
        .from("user_2fa")
        .upsert({ user_id: user.id, secret, is_enabled: false, backup_codes })
        .eq("user_id", user.id);

      if (upsertError) throw upsertError;

      return new Response(JSON.stringify({ otpauthUrl, backup_codes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "verify") {
      const code = String(body.code || "").trim();
      if (!code) {
        return new Response(JSON.stringify({ error: "Code required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const { data: row, error } = await supabase
        .from("user_2fa")
        .select("id, secret, is_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!row) {
        return new Response(JSON.stringify({ error: "No 2FA setup found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const isValid = authenticator.check(code, row.secret);
      if (!isValid) {
        return new Response(JSON.stringify({ valid: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const { error: updateError } = await supabase
        .from("user_2fa")
        .update({ is_enabled: true })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      return new Response(JSON.stringify({ valid: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "validate") {
      const code = String(body.code || "").trim();
      if (!code) {
        return new Response(JSON.stringify({ error: "Code required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const { data: row, error } = await supabase
        .from("user_2fa")
        .select("secret, is_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!row || !row.is_enabled) {
        return new Response(JSON.stringify({ enabled: false, valid: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const valid = authenticator.check(code, row.secret);
      return new Response(JSON.stringify({ enabled: true, valid }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "disable") {
      const { error: delError } = await supabase
        .from("user_2fa")
        .delete()
        .eq("user_id", user.id);
      if (delError) throw delError;
      return new Response(JSON.stringify({ disabled: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // default: fetch current status
    const { data: status, error: stErr } = await supabase
      .from("user_2fa")
      .select("is_enabled")
      .eq("user_id", user.id)
      .maybeSingle();
    if (stErr) throw stErr;

    return new Response(JSON.stringify({ is_enabled: status?.is_enabled ?? false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("TOTP function error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
