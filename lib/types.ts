export type Sector = "Government" | "Private";

export interface Course {
  name: string;
  degree: string;
  specialization: string;
  duration: string;
  seats: number;
  feePerYear: number;
  tag?: string;
}

export interface Placement {
  year: number;
  placementRate: number;
  highestPackage: number;
  averagePackage: number;
  medianPackage: number;
  companiesVisited: number;
  topRecruiters: string[];
}

export interface Cutoff {
  program: string;
  category: string;
  value: string;
  year: number;
}

export interface Review {
  id: string;
  author: string;
  initials: string;
  role: "Alumni" | "Student" | "Parent";
  program: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  helpful: number;
  verified: boolean;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Facilities {
  hostel: boolean;
  library: boolean;
  sports: boolean;
  labs: boolean;
  cafeteria: boolean;
  wifi: boolean;
  gym: boolean;
  transport: boolean;
  medical: boolean;
  auditorium: boolean;
}

export interface Admission {
  process: string;
  eligibility: { program: string; criteria: string }[];
  entranceExams: string[];
  cutoffs: Cutoff[];
  applicationDeadline: string;
  applicationFee: number;
}

export interface RankingEntry {
  agency: string;
  rank: string;
  year: number;
}

export interface College {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  initials: string;
  gradientId: string;
  tagline: string;
  overview: string;
  founded: number;
  type: string;
  sector: Sector;
  accreditation: string[];
  rankings: RankingEntry[];
  city: string;
  state: string;
  pincode: string;
  rating: number;
  reviewCount: number;
  studentCount: number;
  facultyCount: number;
  courses: Course[];
  placement: Placement;
  admission: Admission;
  facilities: Facilities;
  scholarships: string[];
  reviews: Review[];
  faqs: Faq[];
  featured?: boolean;
}

export type SortKey =
  | "relevance"
  | "rating"
  | "fees-asc"
  | "fees-desc"
  | "placement"
  | "reviews"
  | "name";

export interface SearchFilters {
  query: string;
  states: string[];
  cities: string[];
  courseNames: string[];
  sectors: Sector[];
  types: string[];
  exams: string[];
  accreditations: string[];
  hostel: boolean | null;
  placementRate: boolean | null;
  minFee: number | null;
  maxFee: number | null;
  sortBy: SortKey;
}

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  amount: string;
  eligibility: string;
  deadline: string;
  renewable: boolean;
  tags: string[];
  color: string;
}

export interface SearchSuggestion {
  type: "college" | "course" | "city" | "specialization" | "exam";
  label: string;
  sub?: string;
  value: string;
}