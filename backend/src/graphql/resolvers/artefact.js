import { ApolloError } from "apollo-server-express";
import { GenerateRandomItem } from '../../functions'


export default {
    Query: {
        getArtefacts: async (_,{} , { Artefact }) => {
            let artefacts = await Artefact.find();
            return artefacts;
        },
        getHeroArtefacts: async (_, {}, {Hero, user}) => {
            let hero = await Hero.findOne({owner: user.id});
            await hero.populate('artefacts.artefact').execPopulate()
            return hero.artefacts
        }
    },
    Mutation: {
        createArtefact: async (_, {}, { Artefact, Hero, user }) => {
            let items = {}

            let hero = await Hero.findOne({owner: user.id});

            await hero.populate('artefacts.artefact').execPopulate();

            let artefacts = await Artefact.find();
            let mapped = hero.artefacts.map((i,v,arr) => i.artefact._id.toString())
            artefacts = artefacts.filter((doc) => !mapped.includes(doc._id.toString()))

            artefacts.forEach((doc) => {
                items[doc.name] = {
                    probability: 1/artefacts.length,
                    value: doc
                }
            });
            
            let artefact = GenerateRandomItem(items);
            hero.artefacts.push(
                {
                    artefact: artefact.value.value._id,
                    level: 1
                }
            )
            hero[artefact.value.value.stat] = artefact.value.value.multilpier;
            await hero.save();

            await hero.populate('artefacts.artefact').execPopulate();

            return artefact.value.value;
            
        },
        level_up_artefact: async (_, {id}, {Artefact, Hero, user}) => {
            let hero = await Hero.findOne({owner: user.id});
            await hero.populate('artefacts.artefact').execPopulate();
            let artefact = hero.artefacts.filter((v) => v.artefact._id.toString() === id)[0];
            let total_cost = Math.floor((artefact.level * artefact.artefact.cost) - (artefact.level * artefact.artefact.cost) * (hero.upgrade_cost/100))
            if(hero.resurection_points < total_cost){
                throw new ApolloError('Insuficient funds');
            }
            hero.resurection_points -= total_cost;
            ++artefact.level;
            await hero.save();
            return artefact.artefact;
        }
    }
}



