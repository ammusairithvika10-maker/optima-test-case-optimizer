import { useState } from "react";
import Landing from "./pages/Landing";
import Engine from "./pages/Engine";

function App() {
  const [engineStarted, setEngineStarted] = useState(false);

  return (
    <>
      {!engineStarted ? (
        <Landing setEngineStarted={setEngineStarted} />
      ) : (
        <Engine />
      )}
    </>
  );
}

export default App;