/** Place phases in columns and concurrently observed members in rows. */
export function layoutFor(run) {
  const positions = new Map();
  run.phases.forEach((phase, column) => {
    phase.members.forEach((member, row) => {
      positions.set(member.seq, { x: 430 + column * 360, y: 116 + row * 196 });
    });
  });
  return positions;
}

/** The calling Agent is the durable parent of every workflow child. */
export function orchestratorPosition(run) {
  const rows = Math.max(1, ...run.phases.map(phase => phase.members.length));
  return { x: 48, y: 116 + (rows - 1) * 98 };
}
