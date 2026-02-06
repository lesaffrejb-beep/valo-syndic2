/**
 * VALO-SYNDIC — Profils de Coproprietaires (Silicone Sampling)
 * =============================================================
 * 
 * 10 archétypes de coproprietaires rencontres en Assemblee Generale.
 */

import type { DiagnosticResult } from './schemas';

export type OwnerProfileType = 
    | 'young_family'
    | 'professional_landlord'
    | 'eco_conscious_owner'
    | 'retired_fixed_income'
    | 'first_time_buyer'
    | 'portfolio_investor'
    | 'commercial_owner'
    | 'busy_professional'
    | 'occasional_landlord'
    | 'premium_buyer';

export interface OwnerProfile {
    id: OwnerProfileType;
    name: string;
    age: number;
    situation: string;
    income: 'low' | 'medium' | 'high' | 'very_high';
    defaultPosition: 'opposed' | 'skeptical' | 'neutral' | 'favorable';
    mainFear: string;
    mainMotivation: string;
    objections: string[];
    levers: {
        financial: string[];
        emotional: string[];
        practical: string[];
    };
    pdfWording: {
        hook: string;
        monthlyFocus: string;
        benefitFocus: string;
        riskFocus: string;
        ctaPhrase: string;
    };
}

export const OWNER_PROFILES: Record<OwnerProfileType, OwnerProfile> = {
    young_family: {
        id: 'young_family',
        name: 'Marie',
        age: 32,
        situation: 'Primo-accédante, 2 enfants, en congé parental. Achat avec PTZ, endettement conséquent.',
        income: 'low',
        defaultPosition: 'opposed',
        mainFear: 'Ne plus pouvoir payer les charges et perdre son bien',
        mainMotivation: 'Securite et avenir des enfants',
        objections: [
            'Je n ai deja pas assez d argent a la fin du mois',
            'Mes enfants sont petits, je ne veux pas de travaux',
            'Je ne compte pas demenager, le DPE ne me concerne pas'
        ],
        levers: {
            financial: [
                'Mensualite inferieure a un abonnement streaming',
                'Verrouiller les aides = economiser 30% sur le cout total',
                'Protection contre l augmentation des charges de chauffage'
            ],
            emotional: [
                'Offrir un logement sain a ses enfants',
                'Securiser l avenir familial contre les aleas energetiques',
                'Fiereté de devenir proprietaire responsable'
            ],
            practical: [
                'Travaux realises par des professionnels certifies RGE',
                'Accompagnement complet par le syndic',
                'Aucune demarche administrative personnelle'
            ]
        },
        pdfWording: {
            hook: 'Moins d un abonnement telecom par mois pour securiser l avenir de votre famille',
            monthlyFocus: 'Une mensualite de seulement [X]EUR — moins que votre forfait mobile',
            benefitFocus: 'Un logement sain pour vos enfants et une protection contre les hausses',
            riskFocus: 'Sans action, vos charges pourraient augmenter de 40% d ici 2030',
            ctaPhrase: 'Votez aujourd hui pour la tranquillite de demain'
        }
    },

    professional_landlord: {
        id: 'professional_landlord',
        name: 'Pierre',
        age: 58,
        situation: 'Proprietaire de 12 lots dans 4 coproprietes. Profil rentabiliste.',
        income: 'very_high',
        defaultPosition: 'skeptical',
        mainFear: 'Reduction du rendement locatif et tresorerie impactee',
        mainMotivation: 'Rendement et optimisation fiscale',
        objections: [
            'Mon rendement va baisser avec des travaux couteux',
            'Je prefere attendre l interdiction pour agir',
            'Je vais peut-etre vendre dans 5 ans'
        ],
        levers: {
            financial: [
                'Deduction fiscale des travaux sur 10 ans',
                'Valorisation immediate du patrimoine (+12%)',
                'Eviter la decote passoire a la revente (-15%)'
            ],
            emotional: [
                'Securiser son patrimoine transmis aux enfants',
                'Image de proprietaire professionnel et responsable',
                'Anticipation strategique vs reaction en urgence'
            ],
            practical: [
                'Autofinancement quasi-total via aides + Eco-PTZ',
                'Aucune vacance locative pendant les travaux',
                'Gestion cle en main par le syndic'
            ]
        },
        pdfWording: {
            hook: 'Protegez votre rentabilite et valorisez votre patrimoine',
            monthlyFocus: 'Autofinancement optimise — vos loyers couvrent la mensualite',
            benefitFocus: 'Plus-value immediate et deduction fiscale sur 10 ans',
            riskFocus: 'Une passoire thermique se vend 15% moins chere',
            ctaPhrase: 'Anticiper, c est optimiser son rendement'
        }
    },

    eco_conscious_owner: {
        id: 'eco_conscious_owner',
        name: 'Sophie',
        age: 45,
        situation: 'Coproprietaire occupante, travaille dans l environnement. Deja sensibilisee.',
        income: 'medium',
        defaultPosition: 'favorable',
        mainFear: 'Que les travaux ne soient pas suffisants pour vraiment reduire l impact',
        mainMotivation: 'Reduire son empreinte carbone et son impact environnemental',
        objections: [
            'Je veux etre sure que les travaux sont vraiment efficaces',
            'Je crains le greenwashing de certains installateurs',
            'Est-ce que les materiaux utilises sont ecologiques ?'
        ],
        levers: {
            financial: [
                'Economies d energie concretes : -40% de consommation',
                'Aides maximales car profil sortie de passoire',
                'Retour sur investissement carbone : 3 ans'
            ],
            emotional: [
                'Passage a l acte concret pour la planete',
                'Coherence entre ses valeurs et son mode de vie',
                'Exemple pour la communaute'
            ],
            practical: [
                'Audit energetique prealable obligatoire RGE',
                'Tracabilite complete des materiaux et installations',
                'Suivi des economies reelles post-travaux'
            ]
        },
        pdfWording: {
            hook: 'Passez a l acte pour la planete avec des travaux certifies',
            monthlyFocus: 'Un investissement ecologique accessible',
            benefitFocus: '-40% d emissions de CO2 et -35% de consommation energetique',
            riskFocus: 'Chaque annee d attente = 2 tonnes de CO2 supplementaires',
            ctaPhrase: 'Votre engagement ecologique commence aujourd hui'
        }
    },

    retired_fixed_income: {
        id: 'retired_fixed_income',
        name: 'Jean',
        age: 72,
        situation: 'Retraite, revenus fixes, habite depuis 20 ans. Craint le changement.',
        income: 'medium',
        defaultPosition: 'opposed',
        mainFear: 'Ne pas comprendre les enjeux et subir des travaux perturbants',
        mainMotivation: 'Tranquillite et stabilité',
        objections: [
            'Je n ai pas les moyens de payer des travaux supplementaires',
            'Je ne veux pas de desordre chez moi a mon age',
            'Je ne compte plus demenager, ca ne sert a rien',
            'C est trop complique, je ne comprends pas tout'
        ],
        levers: {
            financial: [
                'Aucun apport personnel requis dans la plupart des cas',
                'Mensualite faible et constante sur 20 ans',
                'Economies de chauffage qui compensent une partie du cout'
            ],
            emotional: [
                'Tranquillite : plus de souci de chauffage',
                'Maintien a domicile dans de bonnes conditions',
                'Transmission d un bien valorise aux enfants'
            ],
            practical: [
                'Accompagnement personnalise pour les seniors',
                'Travaux realises en votre absence si souhaite',
                'Explications simples et patience garanties'
            ]
        },
        pdfWording: {
            hook: 'Securite et tranquillite sans deranger votre quotidien',
            monthlyFocus: 'Une petite mensualite, aucun apport demande',
            benefitFocus: 'Un logement plus confortable et des economies de chauffage',
            riskFocus: 'Sans renovation, les charges vont inexorablement augmenter',
            ctaPhrase: 'Pour votre tranquillite et celle de vos proches'
        }
    },

    first_time_buyer: {
        id: 'first_time_buyer',
        name: 'Lucas',
        age: 29,
        situation: 'Premier achat, endette sur 25 ans, vision long terme.',
        income: 'medium',
        defaultPosition: 'neutral',
        mainFear: 'Faire un mauvais investissement qui pèsera sur son avenir',
        mainMotivation: 'Construire son patrimoine sereinement',
        objections: [
            'J ai deja un gros credit, je ne veux pas m endetter plus',
            'Je ne sais pas si je vais rester ici longtemps',
            'C est ma premiere propriete, je ne veux pas de probleme'
        ],
        levers: {
            financial: [
                'Premier investissement patrimonial protege',
                'Plus-value garantie a la revente',
                'Mensualite integree dans le budget charges'
            ],
            emotional: [
                'S entourer de professionnels des le premier achat',
                'Fierte d agir comme un proprietaire averti',
                'Securite dans sa decision d achat'
            ],
            practical: [
                'Accompagnement premier acheteur inclus',
                'Tout est gere par le syndic',
                'Garanties decennales sur tous les travaux'
            ]
        },
        pdfWording: {
            hook: 'Votre premier achat merite la meilleure protection',
            monthlyFocus: 'Investissement patrimonial des le premier achat',
            benefitFocus: 'Securisez votre premier bien avec une plus-value garantie',
            riskFocus: 'Une passoire thermique peut devenir invendable',
            ctaPhrase: 'Commencez votre parcours proprietaire du bon pied'
        }
    },

    portfolio_investor: {
        id: 'portfolio_investor',
        name: 'Catherine',
        age: 51,
        situation: 'Diversifie son patrimoine, deja 3 biens loues, cherche l optimisation.',
        income: 'very_high',
        defaultPosition: 'skeptical',
        mainFear: 'Surcharge administrative et complication de sa gestion',
        mainMotivation: 'Optimisation fiscale et performance patrimoniale',
        objections: [
            'J ai deja trop de biens a gerer, je ne veux pas de complexite',
            'Mes autres biens sont deja conformes, pourquoi celui-la ?',
            'Je prefere attendre de voir comment evolue la reglementation'
        ],
        levers: {
            financial: [
                'Optimisation fiscale globale du patrimoine',
                'Report de deficits possibles entre biens',
                'Valorisation du portefeuille entier'
            ],
            emotional: [
                'Homogeneite et professionnalisation du parc',
                'Anticipation reglementaire pour tous ses biens',
                'Leadership en AG sur un sujet maitrise'
            ],
            practical: [
                'Gestion externalisee totalement',
                'Tableau de bord patrimonial unique',
                'Coordination avec son conseiller fiscal'
            ]
        },
        pdfWording: {
            hook: 'Optimisez votre portefeuille avec une solution cle en main',
            monthlyFocus: 'Integration fluide dans votre strategie patrimoniale',
            benefitFocus: 'Optimisation fiscale et valorisation globale',
            riskFocus: 'Un point faible peut impacter tout votre portefeuille',
            ctaPhrase: 'Completez votre strategie patrimoniale'
        }
    },

    commercial_owner: {
        id: 'commercial_owner',
        name: 'Ahmed',
        age: 41,
        situation: 'Commercant au RDC, proprietaire de son local commercial.',
        income: 'high',
        defaultPosition: 'skeptical',
        mainFear: 'Perte de clientele pendant les travaux',
        mainMotivation: 'Perennite de son commerce et attractivite',
        objections: [
            'Les travaux vont faire fuir ma clientele',
            'Je ne suis pas concerne par les interdictions de location',
            'Mon local commercial a des besoins differents'
        ],
        levers: {
            financial: [
                'Aucune aide pour le commercial, mais pas de cout supplementaire',
                'Valorisation du local commercial',
                'Attractivite accrue du batiment = plus de passage'
            ],
            emotional: [
                'Participation a la valorisation du quartier',
                'Image moderne de son commerce',
                'Solidarite avec les residents du dessus'
            ],
            practical: [
                'Travaux exterieurs coordonnes pour minimiser l impact',
                'Communication clientele professionnelle',
                'Horaires de travaux adaptes aux commerces'
            ]
        },
        pdfWording: {
            hook: 'Valorisez votre commerce en participant a la dynamique du batiment',
            monthlyFocus: 'Participation solidaire sans impact sur votre activite',
            benefitFocus: 'Un batiment valorise attire plus de clientele',
            riskFocus: 'Un immeuble obsolete penalise tout le quartier',
            ctaPhrase: 'Investissez dans l attractivite de votre commerce'
        }
    },

    busy_professional: {
        id: 'busy_professional',
        name: 'Isabelle',
        age: 37,
        situation: 'Cadre superieur, deplacements frequents, peu de temps.',
        income: 'high',
        defaultPosition: 'neutral',
        mainFear: 'Perdre du temps sur des demarches complexes',
        mainMotivation: 'Efficacite et optimisation du temps',
        objections: [
            'Je n ai pas le temps de m occuper de ca',
            'Je suis souvent en deplacement, c complique',
            'J ai deja trop de paperasses a gerer'
        ],
        levers: {
            financial: [
                'Rentabilite passive de son bien',
                'Mensualite automatisee prelevee par le syndic',
                'Aucune gestion personnelle requise'
            ],
            emotional: [
                'Tranquillite d esprit totale',
                'Decision rapide puis oubli',
                'Efficacite professionnelle appliquee a son bien'
            ],
            practical: [
                '100% des demarches gerees par le syndic',
                'Signature electronique disponible',
                'Suivi en ligne accessible de partout'
            ]
        },
        pdfWording: {
            hook: 'La solution la plus rapide : 5 minutes pour 20 ans de tranquillite',
            monthlyFocus: 'Gestion entierement deleguee au syndic',
            benefitFocus: 'Optimisez votre bien sans y consacrer une minute',
            riskFocus: 'Le temps perdu a reporter = de l argent perdu',
            ctaPhrase: 'Votez vite, en 5 minutes c est regle'
        }
    },

    occasional_landlord: {
        id: 'occasional_landlord',
        name: 'Robert',
        age: 66,
        situation: 'A herite du bien de ses parents, le loue occasionnellement.',
        income: 'medium',
        defaultPosition: 'skeptical',
        mainFear: 'Complications pour un bien qui n est pas son principal investissement',
        mainMotivation: 'Preservation du patrimoine familial',
        objections: [
            'C est le bien de mes parents, je ne veux pas y toucher',
            'Je ne loue pas souvent, ca ne vaut pas le coup',
            'Je ne m y connais pas en travaux'
        ],
        levers: {
            financial: [
                'Preservation de la valeur du patrimoine familial',
                'Eviter la decote qui toucherait l heritage',
                'Frais deductibles de la location'
            ],
            emotional: [
                'Honorer la memoire des parents en preservant le bien',
                'Transmission en bon etat aux enfants',
                'Fierte de bien gerer ce qui a ete transmis'
            ],
            practical: [
                'Solution cle en main sans expertise requise',
                'Accompagnement pour les non-inites',
                'Gestion a distance possible'
            ]
        },
        pdfWording: {
            hook: 'Preservez le patrimoine familial dans les meilleures conditions',
            monthlyFocus: 'Une solution simple pour honorer votre heritage',
            benefitFocus: 'Transmission protegee et valorisee aux generations futures',
            riskFocus: 'Un bien non renove perd de sa valeur de transmission',
            ctaPhrase: 'Pour ceux qui nous ont precedes et ceux qui suivent'
        }
    },

    premium_buyer: {
        id: 'premium_buyer',
        name: 'Nadia',
        age: 48,
        situation: 'Profession liberale aisée, veut le meilleur, peu sensible au prix.',
        income: 'very_high',
        defaultPosition: 'favorable',
        mainFear: 'Qualite insuffisante des travaux',
        mainMotivation: 'Excellence et distinction',
        objections: [
            'Je veux etre sure de la qualite des travaux',
            'Je ne veux pas de la solution de base',
            'Qui supervisera la qualite ?'
        ],
        levers: {
            financial: [
                'Solutions haut de gamme disponibles (surcout maitrise)',
                'Valorisation premium du bien',
                'Investissement dans la qualite = meilleur rapport qualite/prix'
            ],
            emotional: [
                'Excellence et distinction du bien',
                'Fierte d un bien qui se demarque',
                'Leadership naturel en AG'
            ],
            practical: [
                'Artisans premium selectionnes',
                'Materiaux haute performance',
                'Suivi qualite renforce'
            ]
        },
        pdfWording: {
            hook: 'Excellence energetique pour une residence d exception',
            monthlyFocus: 'Investissement premium pour resultat premium',
            benefitFocus: 'Une renovation qui correspond a vos standards',
            riskFocus: 'La mediocrite n est pas une option',
            ctaPhrase: 'Exigez l excellence pour votre bien'
        }
    }
};

// =============================================================================
// 3. HELPER FUNCTIONS
// =============================================================================

export function getProfileById(id: OwnerProfileType): OwnerProfile {
    return OWNER_PROFILES[id];
}

export function getAllProfiles(): OwnerProfile[] {
    return Object.values(OWNER_PROFILES);
}

export function getRelevantProfiles(result: DiagnosticResult): OwnerProfile[] {
    const profiles: OwnerProfile[] = [];
    
    // Ajouter les profils pertinents selon le contexte
    if (result.input.numberOfUnits < 10) {
        profiles.push(OWNER_PROFILES.occasional_landlord);
        profiles.push(OWNER_PROFILES.retired_fixed_income);
    }
    
    if (result.financing.remainingCostPerUnit < 5000) {
        profiles.push(OWNER_PROFILES.young_family);
        profiles.push(OWNER_PROFILES.first_time_buyer);
    }
    
    if (result.compliance.isProhibited || (result.compliance.daysUntilProhibition || 0) < 730) {
        profiles.push(OWNER_PROFILES.professional_landlord);
        profiles.push(OWNER_PROFILES.portfolio_investor);
    }
    
    // Toujours inclure ces profils
    profiles.push(OWNER_PROFILES.eco_conscious_owner);
    profiles.push(OWNER_PROFILES.busy_professional);
    profiles.push(OWNER_PROFILES.premium_buyer);
    
    // Supprimer les doublons
    return Array.from(new Map(profiles.map(p => [p.id, p])).values());
}

export function getWordingForProfile(
    profile: OwnerProfile,
    result: DiagnosticResult
): OwnerProfile['pdfWording'] {
    const wording = { ...profile.pdfWording };
    const monthlyPayment = Math.round((result.financing.ecoPtzAmount * 0.1) / 240);
    
    // Remplacer les placeholders
    wording.monthlyFocus = wording.monthlyFocus.replace('[X]', monthlyPayment.toString());
    
    return wording;
}
