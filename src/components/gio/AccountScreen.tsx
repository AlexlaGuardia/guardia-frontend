"use client";

import GuardiaAccount from "../lobby/GuardiaAccount";

interface AccountScreenProps {
  jwt?: string | null;
  onLogout?: () => void;
  onNavigateToStore?: () => void;
}

export default function AccountScreen({ jwt, onLogout, onNavigateToStore }: AccountScreenProps) {
  return (
    <div className="h-full overflow-y-auto">
      <GuardiaAccount jwt={jwt} onLogout={onLogout} onNavigateToStore={onNavigateToStore} />
    </div>
  );
}
