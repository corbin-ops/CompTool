import { CompToolPlayground } from "@/comp-tool/playground";

export function CompToolPageShell() {
  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Dew Claw Comp Tool</p>
          <h1>Retrieval-first comp builder</h1>
          <p>
            This MVP assembles the right DewClaw training context and builds a prompt packet you can
            send to Claude or wire into the next model step.
          </p>
        </div>

        <div className="hero-actions">
          <form action="/api/auth/logout" method="post">
            <button className="secondary-button" type="submit">
              Log out
            </button>
          </form>
        </div>
      </section>

      <CompToolPlayground />
    </main>
  );
}
