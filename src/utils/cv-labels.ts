export interface CvLabels {
  keySkills: string;
  operationalSummary: string;
  areasOfExpertise: string;
  keySkillsLine: string;
  expandCollapseAll: string;
  collapseExpandExp: string;
  copy: string;
  today: string;
  dateLocale: string;
  characters: string;
  overLimit: string;
  nav: { profile: string; areas: string; skills: string; experience: string; education: string; projects: string };
  skillCards: Array<{ key: string; label: string; labelShort?: string }>;
  expSections: { main: string; production: string; complementary: string; early: string };
  expTitle: string;
  appendix: { education: string; projects: string; extraInfo: string; interests: string };
  downloadLabels: { short: string; detailed: string; careerChannel: string };
  careerChannel: { expTitle: string; copyHelp: string; pageTitle: string; pageDescription: string; pageIntro: string };
  toggleSkills: string;
  variantLabels: { short: string; detailed: string; careerChannel: string };
  printExport: string;
  downloadPhoto: string;
  langSwitcher: string;
  langFrLabel: string;
  langEnLabel: string;
  downloadPdf: string;
}

const FR: CvLabels = {
  keySkills: 'Compétences clés',
  operationalSummary: 'Synthèse opérationnelle',
  areasOfExpertise: "Domaines d'intervention",
  keySkillsLine: 'Compétences clés :',
  expandCollapseAll: 'Tout déplier / tout replier',
  collapseExpandExp: "Replier / déplier l'expérience",
  copy: 'Copier',
  today: "Aujourd'hui",
  dateLocale: 'fr-FR',
  characters: 'caractères',
  overLimit: '— dépasse la limite de la plateforme',
  nav: { profile: 'Profil', areas: 'Domaines', skills: 'Compétences', experience: 'Expériences', education: 'Formation', projects: 'Projets' },
  skillCards: [
    { key: 'leadership', label: 'Leadership technique & architecture', labelShort: 'Leadership & architecture' },
    { key: 'delivery', label: 'Management & delivery', labelShort: 'Management' },
    { key: 'quality', label: 'Qualité & industrialisation', labelShort: 'Qualité' },
    { key: 'frontend', label: 'Frontend' },
    { key: 'backend', label: 'Backend & Fullstack', labelShort: 'Backend' },
    { key: 'databases', label: 'Bases de données' },
    { key: 'devops', label: 'DevOps & production', labelShort: 'DevOps' },
    { key: 'toolsMethods', label: 'Outils & Méthodes', labelShort: 'Outils' },
    { key: 'ia', label: 'IA assistée & automatisation', labelShort: 'IA assistée' },
  ],
  expSections: {
    main: 'Expériences principales',
    production: 'Expérience fondatrice production',
    complementary: 'Expériences complémentaires',
    early: 'Stages & premières missions',
  },
  expTitle: 'Expériences professionnelles',
  appendix: {
    education: 'Formation',
    projects: 'Projets personnels & expérimentations',
    extraInfo: 'Informations complémentaires',
    interests: "Centres d'intérêt",
  },
  downloadLabels: { short: 'Télécharger le PDF court', detailed: 'Télécharger le PDF détaillé', careerChannel: 'Télécharger le PDF réseau' },
  careerChannel: {
    expTitle: 'Expériences professionnelles',
    copyHelp: 'Cliquez sur <strong class="text-foreground/80">Copier</strong> pour copier la description.',
    pageTitle: 'CV — Format réseau professionnel',
    pageDescription: 'Descriptions de mes expériences professionnelles prêtes à copier-coller',
    pageIntro: 'Format réseau professionnel — retrouvez ici titre de poste, biographie et expériences dans un format optimisé pour <strong class="text-foreground/80">LinkedIn</strong> et les plateformes similaires. Chaque description est prête à coller en un clic, sans reformatage.',
  },
  variantLabels: { short: 'Court', detailed: 'Détaillé', careerChannel: 'Réseau' },
  toggleSkills: 'Afficher / masquer les compétences',
  printExport: 'Imprimer / Exporter en PDF',
  downloadPhoto: 'Télécharger la photo',
  langSwitcher: 'Sélection de la langue',
  langFrLabel: 'Version française',
  langEnLabel: 'Version anglaise',
  downloadPdf: 'Télécharger le PDF',
};

const EN: CvLabels = {
  keySkills: 'Key skills',
  operationalSummary: 'Operational summary',
  areasOfExpertise: 'Areas of expertise',
  keySkillsLine: 'Key skills:',
  expandCollapseAll: 'Expand all / collapse all',
  collapseExpandExp: 'Collapse / expand experience',
  copy: 'Copy',
  today: 'Today',
  dateLocale: 'en-GB',
  characters: 'characters',
  overLimit: '— exceeds platform limit',
  nav: { profile: 'Profile', areas: 'Areas', skills: 'Skills', experience: 'Experience', education: 'Education', projects: 'Projects' },
  skillCards: [
    { key: 'leadership', label: 'Technical leadership & architecture', labelShort: 'Leadership & architecture' },
    { key: 'delivery', label: 'Management & delivery', labelShort: 'Management' },
    { key: 'quality', label: 'Quality & industrialisation', labelShort: 'Quality' },
    { key: 'frontend', label: 'Frontend' },
    { key: 'backend', label: 'Backend & Fullstack', labelShort: 'Backend' },
    { key: 'databases', label: 'Databases' },
    { key: 'devops', label: 'DevOps & production', labelShort: 'DevOps' },
    { key: 'toolsMethods', label: 'Tools & Methods', labelShort: 'Tools' },
    { key: 'ia', label: 'AI assistance & automation', labelShort: 'AI assistance' },
  ],
  expSections: {
    main: 'Main experience',
    production: 'Foundational production experience',
    complementary: 'Complementary experience',
    early: 'Internships & early positions',
  },
  expTitle: 'Professional experience',
  appendix: {
    education: 'Education',
    projects: 'Personal projects & experiments',
    extraInfo: 'Additional information',
    interests: 'Interests',
  },
  downloadLabels: { short: 'Download short PDF', detailed: 'Download detailed PDF', careerChannel: 'Download network PDF' },
  careerChannel: {
    expTitle: 'Professional experience',
    copyHelp: 'Click <strong class="text-foreground/80">Copy</strong> to copy the description.',
    pageTitle: 'CV — Professional network format',
    pageDescription: 'Professional experience descriptions ready to copy-paste',
    pageIntro: 'Professional network format — find your job title, biography and experiences in an optimised format for <strong class="text-foreground/80">LinkedIn</strong> and similar platforms. Each description is ready to paste in one click, with no reformatting needed.',
  },
  variantLabels: { short: 'Short', detailed: 'Detailed', careerChannel: 'Network' },
  toggleSkills: 'Show / hide skills',
  printExport: 'Print / Export as PDF',
  downloadPhoto: 'Download photo',
  langSwitcher: 'Language selection',
  langFrLabel: 'French version',
  langEnLabel: 'English version',
  downloadPdf: 'Download PDF',
};

export function getCvLabels(locale: string | undefined): CvLabels {
  return locale === 'en' ? EN : FR;
}
