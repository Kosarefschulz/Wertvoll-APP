import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.date(),
});

export const copilotRouter = createTRPCRouter({
  processMessage: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        context: z.array(messageSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const employee = await ctx.prisma.employee.findUnique({
        where: { userId: ctx.session.user.id },
        include: { company: true },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const systemPrompt = `Du bist ein KI-Assistent für die Wertvoll Dienstleistungen GmbH Dispositions-App. 
Du hilfst Mitarbeitern bei folgenden Aufgaben:
- Kunden anlegen
- Angebote erstellen
- Rechnungen versenden
- Aufträge disponieren
- Informationen abrufen

Nutze die verfügbaren Funktionen, um diese Aufgaben auszuführen.
Antworte immer auf Deutsch und sei höflich und professionell.`;

      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
      ];

      if (input.context) {
        input.context.forEach((msg) => {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        });
      }

      messages.push({ role: 'user', content: input.message });

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages,
          tools: [
            {
              type: 'function',
              function: {
                name: 'create_customer',
                description: 'Einen neuen Kunden anlegen',
                parameters: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Name des Kunden' },
                    email: { type: 'string', description: 'E-Mail-Adresse' },
                    address: { type: 'string', description: 'Adresse' },
                    phone: { type: 'string', description: 'Telefonnummer (optional)' },
                    type: { type: 'string', enum: ['PRIVATE', 'BUSINESS'], description: 'Kundentyp' },
                  },
                  required: ['name', 'email', 'address'],
                },
              },
            },
            {
              type: 'function',
              function: {
                name: 'create_offer',
                description: 'Ein neues Angebot für einen Kunden erstellen',
                parameters: {
                  type: 'object',
                  properties: {
                    customerName: { type: 'string', description: 'Name des Kunden' },
                    totalPrice: { type: 'number', description: 'Gesamtpreis' },
                    note: { type: 'string', description: 'Notizen zum Angebot' },
                  },
                  required: ['customerName'],
                },
              },
            },
            {
              type: 'function',
              function: {
                name: 'get_open_leads',
                description: 'Anzahl der offenen Leads abrufen',
                parameters: { type: 'object', properties: {} },
              },
            },
          ],
          tool_choice: 'auto',
        });

        const responseMessage = completion.choices[0].message;

        if (responseMessage.tool_calls) {
          for (const toolCall of responseMessage.tool_calls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);

            switch (functionName) {
              case 'create_customer':
                const customer = await ctx.prisma.customer.create({
                  data: {
                    companyId: employee.companyId,
                    name: functionArgs.name,
                    email: functionArgs.email,
                    address: functionArgs.address,
                    phone: functionArgs.phone,
                    type: functionArgs.type || 'PRIVATE',
                  },
                });
                return {
                  message: `Kunde "${customer.name}" wurde erfolgreich angelegt.`,
                };

              case 'create_offer':
                const foundCustomer = await ctx.prisma.customer.findFirst({
                  where: {
                    companyId: employee.companyId,
                    name: {
                      contains: functionArgs.customerName,
                      mode: 'insensitive',
                    },
                  },
                });

                if (!foundCustomer) {
                  return {
                    message: `Kunde "${functionArgs.customerName}" wurde nicht gefunden. Bitte legen Sie den Kunden zuerst an.`,
                  };
                }

                const offer = await ctx.prisma.offer.create({
                  data: {
                    customerId: foundCustomer.id,
                    status: 'DRAFT',
                    totalPrice: functionArgs.totalPrice,
                    note: functionArgs.note,
                    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                  },
                });

                return {
                  message: `Angebot für "${foundCustomer.name}" wurde erstellt. ${
                    functionArgs.totalPrice
                      ? `Gesamtpreis: ${functionArgs.totalPrice.toFixed(2)} €`
                      : 'Preis noch nicht festgelegt.'
                  }`,
                };

              case 'get_open_leads':
                const openLeads = await ctx.prisma.customer.count({
                  where: {
                    companyId: employee.companyId,
                    offers: {
                      none: {},
                    },
                  },
                });

                return {
                  message: `Sie haben aktuell ${openLeads} offene Leads (Kunden ohne Angebot).`,
                };

              default:
                return {
                  message: 'Diese Funktion ist noch nicht implementiert.',
                };
            }
          }
        }

        return {
          message: responseMessage.content || 'Ich verstehe Ihre Anfrage. Wie kann ich Ihnen helfen?',
        };
      } catch (error) {
        console.error('OpenAI error:', error);
        throw new Error('Fehler bei der Verarbeitung Ihrer Anfrage');
      }
    }),
});