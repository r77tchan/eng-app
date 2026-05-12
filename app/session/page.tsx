"use client";

import { useCallback, useState } from "react";
import { SessionRunner } from "./_components/SessionRunner";

/**
 * セッション画面のエントリーポイント。
 *
 * 役割はリスタート制御だけに絞り、実際の state 管理 / 出題ロジックは
 * `SessionRunner` 側に委譲する。`sessionKey` を変えると React は
 * `SessionRunner` を再マウントするため、内部 state が初期値にリセットされる。
 * (useEffect 内での同期的な setState によるリセットを避けるための分離)
 */
export default function SessionPage() {
  const [sessionKey, setSessionKey] = useState(0);

  const handleRestart = useCallback(() => {
    setSessionKey((k) => k + 1);
  }, []);

  return <SessionRunner key={sessionKey} onRestart={handleRestart} />;
}
