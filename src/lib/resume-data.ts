export interface ResumeData {
  name: string;
  title: string;
  location: string;
  email: string;
  summary: string;
  experience: Experience[];
  projects: Project[];
  skills: SkillCategory[];
  education: Education[];
  contact: ContactInfo;
}

interface Experience {
  company: string;
  role: string;
  period: string;
  highlights: string[];
}

interface Project {
  name: string;
  description: string;
  tech: string[];
  url?: string;
}

interface SkillCategory {
  category: string;
  items: string[];
}

interface Education {
  institution: string;
  degree: string;
  year: string;
}

interface ContactInfo {
  email: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

export function getResumeData(): ResumeData {
  return {
    name: "Matthew Sherlin",
    title: "COO & Head of Forward Deployed Engineering at Linkt",
    location: "Remote / Austin, TX",
    email: "mattssherlin@gmail.com",
    summary:
      "Senior Software Engineer serving as COO and Head of FDE at Linkt, shipping production systems that drive business results. 5 years building scalable backend infrastructure and AI/ML systems across mission-critical environments — from NASA Mission Control and U.S. Navy maritime operations to enterprise AI platforms with 12,000+ users. Combines deep technical ownership with stakeholder management, team leadership, and a proven track record of turning engineering into revenue growth.",
    experience: [
      {
        company: "Linkt",
        role: "COO & Head of Forward Deployed Engineering",
        period: "Jan 2026 - Present",
        highlights: [
          "Promoted from contract Senior Software Engineer after driving 2x+ ARR growth, owning 3 major client platforms, and contributing to 5+ other clients and internal products",
          "Work directly with CEO and CTO on product strategy and client relationships; manage cross-functional task delegation and serve as primary point of contact for key accounts",
          "Evaluated 7+ engineering candidates and established standardized assessment framework; oversee internal engineering team and mentor junior developers",
        ],
      },
      {
        company: "Linkt",
        role: "Senior Software Engineer (contract)",
        period: "Oct 2024 - Jan 2026",
        highlights: [
          "Built and scaled AI content generation platform for Etsy sellers to 12,000+ users (1,500+ MAU), reducing costs by 40%+; expanded to Shopify using LangChain, Anthropic/Gemini LLMs, and fine-tuned models on Vertex AI",
          "Built AI-powered UI generation system converting call transcripts into branded apps in under 20 minutes using multi-stage LLM pipeline with Claude CLI agentic swarm and MCP tools",
          "Indexed 30,000+ talent profiles and 4,000+ companies in matching platform using Meilisearch, Neo4j graph modeling, and hybrid semantic search with vector embeddings",
          "Deployed AI-powered retail cigar recommendation system across 10+ shop locations with in-store tablet interface",
        ],
      },
      {
        company: "Northrop Grumman",
        role: "Software Engineer",
        period: "Oct 2022 - Oct 2024",
        highlights: [
          "Delivered features across 20+ mission-critical applications for NASA and U.S. Navy contracts, managing 150% FTE workload across 4-5 concurrent contracts",
          "Supported quarterly NASA rocket fuel logistics missions to Kennedy Space Center — maintained and debugged mathematical algorithms for fuel weight and transfer parameters",
          "Maintained near-100% uptime across 20+ .NET/.NET Core Maritime Systems applications serving ~100 U.S. Navy personnel across East Coast factory operations",
          "Developed 8 NuGet packages to modularize shared dependencies, streamlining developer onboarding; received monetary performance award for engineering contributions",
        ],
      },
      {
        company: "Developer Squad",
        role: "Software Engineer",
        period: "Jan 2022 - May 2023",
        highlights: [
          "Led team of 7 engineers building decentralized applications; deployed 5+ Solidity smart contracts to Polygon, Ethereum Mainnet, and EVM-compatible chains",
          "Built Web2-to-Web3 integration bridges using ethers.js and web3.js, connecting applications with decentralized hosting infrastructure",
        ],
      },
      {
        company: "Kent State University",
        role: "Undergraduate Research Assistant",
        period: "Sep 2021 - Jan 2022",
        highlights: [
          "Collaborated on medical extended reality application for IV insertion training; created deformable mesh human models with dynamic blood vessel systems in Unity",
          "Developed live AR web applications using marker-based mobile tracking",
        ],
      },
    ],
    projects: [
      {
        name: "Terminal Portfolio",
        description:
          "This website! A retro CRT terminal portfolio with 3D effects, games, and an achievement system.",
        tech: ["Next.js", "TypeScript", "Three.js", "React Three Fiber", "Tailwind CSS"],
        url: "https://github.com/MatthewSherlin/portfolio",
      },
      {
        name: "Autonomous Language Interpreter",
        description:
          "Full-stack real-time conversation interpretation and translation app for medical environments with SOAP notes, discharge instructions, and multi-language support.",
        tech: ["Python", "Pandas", "Flask", "Cloud APIs", "MySQL", "JavaScript"],
        url: "https://github.com/MatthewSherlin/Autonomous-Language-Interpreter",
      },
      {
        name: "NomadDAO",
        description:
          "Decentralized autonomous organization platform for digital nomads with smart contract governance and community voting on Ethereum.",
        tech: ["Solidity", "JavaScript", "React", "Node.js", "Hardhat"],
        url: "https://github.com/MatthewSherlin/NomadDAO",
      },
    ],
    skills: [
      {
        category: "Languages & Frameworks",
        items: ["Python", "JavaScript/TypeScript", "C#", "C/C++", "Solidity", "FastAPI", "Django", ".NET", "Node.js", "Express", "Next.js", "React"],
      },
      {
        category: "AI/ML & Data",
        items: ["LangChain", "Claude CLI", "LiteLLM", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "Keras", "MCP", "Meilisearch", "Prefect", "RAG"],
      },
      {
        category: "Databases & Cloud",
        items: ["Neo4j", "MongoDB", "MySQL", "Oracle SQL", "Docker", "Git", "AWS", "GCP", "Vertex AI", "Terraform", "CI/CD"],
      },
    ],
    education: [
      {
        institution: "Kent State University",
        degree: "B.S. Computer Science — GPA: 3.93/4.0",
        year: "2018 - 2021",
      },
      {
        institution: "Stanford University",
        degree: "Advanced Learning Algorithms (Certificate)",
        year: "2024",
      },
      {
        institution: "Stanford University",
        degree: "Supervised ML: Regression & Classification (Certificate)",
        year: "2024",
      },
    ],
    contact: {
      email: "mattssherlin@gmail.com",
      github: "https://github.com/MatthewSherlin",
      linkedin: "https://linkedin.com/in/matthewsherlin",
    },
  };
}
