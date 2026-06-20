export const permissionsSeed = [
  "users.read",
  "users.write",
  "devices.read",
  "devices.write",
  "risk.read",
  "risk.write",
  "audit.read",
  "audit.write",
  "kyc.read",
  "kyc.write"
] as const;

export const rolesSeed = [
  {
    name: "CUSTOMER",
    description: "Customer account holder with access to personal security posture.",
    permissions: ["devices.read", "risk.read"]
  },
  {
    name: "EMPLOYEE",
    description: "Bank employee with limited operational read access.",
    permissions: ["users.read", "devices.read", "risk.read", "kyc.read"]
  },
  {
    name: "MANAGER",
    description: "Operational manager with case and KYC write authority.",
    permissions: ["users.read", "devices.read", "risk.read", "risk.write", "kyc.read", "kyc.write"]
  },
  {
    name: "SECURITY_ANALYST",
    description: "Security analyst responsible for device, risk, and audit investigations.",
    permissions: ["users.read", "devices.read", "devices.write", "risk.read", "risk.write", "audit.read"]
  },
  {
    name: "ADMIN",
    description: "Platform administrator with user, device, risk, audit, and KYC administration.",
    permissions: [...permissionsSeed]
  }
] as const;

export const demoUsersSeed = [
  {
    email: "customer@trustchain.local",
    phone: "+15550001001",
    password: "DemoCustomer!2026",
    customerId: "CUST-DEMO-001",
    roles: ["CUSTOMER"],
    trustScore: 84
  },
  {
    email: "employee@trustchain.local",
    phone: "+15550001002",
    password: "DemoEmployee!2026",
    employeeId: "EMP-DEMO-001",
    roles: ["EMPLOYEE"],
    trustScore: 76
  },
  {
    email: "analyst@trustchain.local",
    phone: "+15550001003",
    password: "DemoAnalyst!2026",
    employeeId: "SEC-DEMO-001",
    roles: ["SECURITY_ANALYST"],
    trustScore: 72
  },
  {
    email: "admin@trustchain.local",
    phone: "+15550001004",
    password: "DemoAdmin!2026",
    employeeId: "ADM-DEMO-001",
    roles: ["ADMIN"],
    trustScore: 68
  }
] as const;
