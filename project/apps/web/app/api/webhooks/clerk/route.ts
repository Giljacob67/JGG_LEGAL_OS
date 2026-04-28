import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assignDefaultPermissions } from "@/lib/auth";
import { Role } from "@prisma/client";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

function validateSecret(): string {
  if (!WEBHOOK_SECRET) {
    throw new Error(
      "CLERK_WEBHOOK_SECRET não configurado. Configure no Vercel Dashboard."
    );
  }
  return WEBHOOK_SECRET;
}

type ClerkWebhookEvent = {
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    first_name?: string;
    last_name?: string;
    image_url?: string;
    public_metadata?: { role?: string; oab?: string };
  };
  object: string;
  type: string;
};

export async function POST(req: Request) {
  try {
    const secret = validateSecret();
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: "Headers de webhook ausentes" },
        { status: 400 }
      );
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(secret);
    const evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent;

    const eventType = evt.type;
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } =
      evt.data;

    const email = email_addresses?.[0]?.email_address;
    const nome = [first_name, last_name].filter(Boolean).join(" ") || email || "Usuário";
    const roleStr = public_metadata?.role || "advogado";
    const role = Object.values(Role).includes(roleStr as Role)
      ? (roleStr as Role)
      : Role.advogado;

    switch (eventType) {
      case "user.created": {
        const existing = await prisma.user.findUnique({
          where: { clerkId: id },
        });

        if (!existing) {
          const user = await prisma.user.create({
            data: {
              clerkId: id,
              email: email || "",
              nome,
              avatar: image_url || null,
              role,
              oab: public_metadata?.oab || null,
            },
          });

          await assignDefaultPermissions(user.id, role);
        }
        break;
      }

      case "user.updated": {
        await prisma.user.updateMany({
          where: { clerkId: id },
          data: {
            email: email || undefined,
            nome,
            avatar: image_url || null,
            role,
            oab: public_metadata?.oab || null,
          },
        });

        // Reassign permissions if role changed
        const user = await prisma.user.findUnique({ where: { clerkId: id } });
        if (user && user.role !== role) {
          await prisma.userPermission.deleteMany({ where: { userId: user.id } });
          await assignDefaultPermissions(user.id, role);
        }
        break;
      }

      case "user.deleted": {
        const user = await prisma.user.findUnique({ where: { clerkId: id } });
        if (user) {
          await prisma.userPermission.deleteMany({ where: { userId: user.id } });
          await prisma.user.update({
            where: { id: user.id },
            data: { ativo: false, deletedAt: new Date() },
          });
        }
        break;
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[CLERK_WEBHOOK] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}
