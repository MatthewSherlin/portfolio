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
    title: "Head of Forward Deployed Engineering | COO at Linkt",
    location: "Remote / Austin, TX",
    email: "mattssherlin@gmail.com",
    summary:
      "Senior Software Engineer with 5 years of experience building production AI/ML systems and scalable backend infrastructure. Currently serving as Head of Forward Deployed Engineering and COO at Linkt — hands-on developing enterprise AI solutions while driving 2x+ ARR growth. Proven track record from NASA and U.S. Navy (Northrop Grumman) to Web3 and early-stage startups.",
    experience: [
      {
        company: "Linkt",
        role: "Head of Forward Deployed Engineering",
        period: "Oct 2024 - Present",
        highlights: [
          "Built AI-powered UI generation system converting call transcripts into branded apps in under 20 minutes using multi-stage LLM pipeline with Claude CLI agentic swarm",
          "Scaled AI content generation platform for Etsy sellers to 8,700+ users, reducing costs by 40%+",
          "Developed AI recommendation system for retail cigar matching deployed across 10+ shop locations",
          "Engineered talent-company matching platform with Neo4j graph DB and hybrid semantic search",
          "Contributed to 2x+ ARR growth through stakeholder management and strategic execution",
        ],
      },
      {
        company: "Northrop Grumman",
        role: "Software Engineer",
        period: "Oct 2022 - Oct 2024",
        highlights: [
          "Delivered features for mission-critical NASA Mission Control Center and U.S. Navy Maritime Systems",
          "Managed 150% FTE workload across 20+ applications and 4-5 concurrent contracts",
          "Supported quarterly NASA rocket fuel logistics missions to Kennedy Space Center",
          "Implemented CI/CD pipelines across 10 applications and developed 8 NuGet packages",
        ],
      },
      {
        company: "Developer Squad",
        role: "Software Engineer",
        period: "Jan 2022 - May 2023",
        highlights: [
          "Led team of 7 engineers building decentralized applications",
          "Deployed 5+ Solidity smart contracts to Polygon, Ethereum Mainnet, and EVM-compatible chains",
          "Created Web2-to-Web3 integration bridges using ethers.js and web3.js",
        ],
      },
      {
        company: "Kent State University",
        role: "Undergraduate Research Assistant",
        period: "Sep 2021 - Jan 2022",
        highlights: [
          "Collaborated on medical XR application for IV insertion training",
          "Created deformable mesh human models with dynamic blood vessel systems in Unity",
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
        tech: ["Solidity", "ethers.js", "React", "Node.js", "Hardhat"],
        url: "https://github.com/MatthewSherlin/NomadDAO",
      },
    ],
    skills: [
      {
        category: "Languages",
        items: ["Python", "JavaScript/TypeScript", "C#", "C/C++", "Solidity", "SQL"],
      },
      {
        category: "AI/ML & Data",
        items: ["LangChain", "Claude CLI", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "RAG", "MCP"],
      },
      {
        category: "Frameworks",
        items: ["FastAPI", "Django", ".NET", "Node.js", "Flask", "Express", "Next.js", "React"],
      },
      {
        category: "Databases",
        items: ["Neo4j", "MongoDB", "MySQL", "Oracle SQL"],
      },
      {
        category: "Cloud & Infra",
        items: ["Docker", "AWS", "GCP", "Vertex AI", "Terraform", "CI/CD", "Git"],
      },
      {
        category: "Web3",
        items: ["Ethereum", "Polygon", "Hardhat", "ethers.js", "web3.js", "Pinata"],
      },
    ],
    education: [
      {
        institution: "Kent State University",
        degree: "B.S. Computer Science — GPA: 3.93/4.0",
        year: "2021",
      },
    ],
    contact: {
      email: "mattssherlin@gmail.com",
      github: "https://github.com/MatthewSherlin",
      linkedin: "https://linkedin.com/in/matthewsherlin",
    },
  };
}
