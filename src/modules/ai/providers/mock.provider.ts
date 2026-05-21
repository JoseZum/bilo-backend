import { Injectable } from '@nestjs/common';
import { AIAskInput, AIAskOutput, AIProvider } from './ai-provider.interface';

const NO_INFO: AIAskOutput = {
  answer: 'No tengo suficiente información para responder eso.',
  usedContext: false,
};

@Injectable()
export class MockAIProvider implements AIProvider {
  async ask(input: AIAskInput): Promise<AIAskOutput> {
    const ctx = (input.contextText || '').trim();
    const q = (input.question || '').toLowerCase();

    if (!ctx) return { ...NO_INFO };
    const ctxLower = ctx.toLowerCase();

    // Pets
    if (/(mascota|pets?|perro|gato)/i.test(q)) {
      if (
        /petsallowed:\s*true/i.test(ctx) ||
        /acepta mascotas/i.test(ctxLower)
      ) {
        return { answer: 'Sí, esta propiedad acepta mascotas.', usedContext: true };
      }
      if (
        /petsallowed:\s*false/i.test(ctx) ||
        /no acepta mascotas/i.test(ctxLower)
      ) {
        return { answer: 'No, esta propiedad no acepta mascotas.', usedContext: true };
      }
    }

    // Parking
    if (/(parqueo|parking|estacionamiento)/i.test(q)) {
      if (
        /parking:\s*true/i.test(ctx) ||
        /tiene parqueo/i.test(ctxLower) ||
        /tiene estacionamiento/i.test(ctxLower)
      ) {
        return { answer: 'Sí, esta propiedad tiene parqueo.', usedContext: true };
      }
      if (
        /parking:\s*false/i.test(ctx) ||
        /no tiene parqueo/i.test(ctxLower) ||
        /sin parqueo/i.test(ctxLower)
      ) {
        return { answer: 'No, esta propiedad no tiene parqueo.', usedContext: true };
      }
    }

    // Price
    if (/(precio|price|costo|renta|alquiler)/i.test(q)) {
      const priceMatch = ctx.match(/monthlyPrice\s+(\d+)\s+(\w+)/i);
      if (priceMatch) {
        return {
          answer: `El precio mensual es ${priceMatch[1]} ${priceMatch[2]}.`,
          usedContext: true,
        };
      }
    }

    // Furnished
    if (/(amueblado|furnished|amoblado|muebles)/i.test(q)) {
      if (
        /furnished:\s*true/i.test(ctx) ||
        /está amueblado/i.test(ctxLower) ||
        /amueblada/i.test(ctxLower)
      ) {
        return { answer: 'Sí, esta propiedad está amueblada.', usedContext: true };
      }
      if (
        /furnished:\s*false/i.test(ctx) ||
        /no está amueblado/i.test(ctxLower) ||
        /sin amueblar/i.test(ctxLower)
      ) {
        return { answer: 'No, esta propiedad no está amueblada.', usedContext: true };
      }
    }

    return { ...NO_INFO };
  }
}
