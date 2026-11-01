// @ts-check
/**
 * @fileoverview Generic / Custom event contextual decision rules.
 */

export const rules = Object.freeze([
  {
    id: 'G-DEFAULT',
    description: 'Standard custom event operational framework',
    applies: () => true,
    apply: (ctx) => {
      const title = ctx.request.eventName || 'Custom Event';
      return {
        warnings: [
          `Planning for "${title}": Applying standard baseline split with contingency reserve. Customize vendor scopes according to your goals.`,
        ],
      };
    },
  },
]);
