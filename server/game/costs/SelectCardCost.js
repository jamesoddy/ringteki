const _ = require('underscore');
const CardSelector = require('../CardSelector.js');
const { Locations, Players } = require('../Constants');

class SelectCardCost {
    constructor(action, promptProperties) {
        this.action = action;
        this.selector = this.createSelector(action, promptProperties);
        this.activePromptTitle = promptProperties.activePromptTitle;
        this.promptsPlayer = true;
        this.targets = promptProperties.targets;
    }

    createSelector(action, properties) {
        let condition = (card, context) => {
            return action.canAffect(card, context) && properties.cardCondition(card, context);
        };

        let fullProperties = Object.assign({ location: Locations.Any, controller: Players.Self }, properties, { cardCondition: condition });

        return CardSelector.for(fullProperties);
    }

    canPay(context) {
        return this.selector.hasEnoughTargets(context, context.player);
    }

    resolve(context, result) {
        if(this.targets && context.choosingPlayerOverride) {
            context.costs[this.action.name] = _.shuffle(this.selector.getAllLegalTargets(context, context.player))[0];
            context.costs[this.action.name + 'StateWhenChosen'] = context.costs[this.action.name].createSnapshot();
            return result;
        }
        context.game.promptForSelect(context.player, {
            activePromptTitle: this.activePromptTitle,
            context: context,
            selector: this.selector,
            buttons: result.canCancel ? [{ text: 'Cancel', arg: 'cancel' }] : [],
            onSelect: (player, cards) => {
                context.costs[this.action.name] = cards;
                if(Array.isArray(cards)) {
                    context.costs[this.action.name + 'StateWhenChosen'] = cards.map(card => card.createSnapshot());
                } else {
                    context.costs[this.action.name + 'StateWhenChosen'] = cards.createSnapshot();
                }
                return true;
            },
            onCancel: () => result.cancelled = true
        });

        return result;
    }

    payEvent(context) {
        return this.action.getEventArray(context, { target: context.costs[this.action.name] });
    }
}

module.exports = SelectCardCost;
