import {
  Navigation
} from "world-core";

import type {
  Simulation
} from "../simulation.js";

import type {
  MapDefinition
} from "./types.js";

function assertSamePosition(
  label: string,
  actual: {
    x: number;
    y: number;
  },
  expected: {
    x: number;
    y: number;
  }
): void {
  if (
    actual.x !== expected.x ||
    actual.y !== expected.y
  ) {
    throw new Error(
      `${label} position does not match its navigation node`
    );
  }
}

export function materializeMap(
  simulation: Simulation,
  definition: MapDefinition
): Simulation {
  const topologies =
    new Map<string, Navigation>();

  for (
    const topologyDefinition
    of definition.navigation.topologies
  ) {
    const topology =
      new Navigation();

    for (
      const node
      of topologyDefinition.nodes
    ) {
      topology.addNode({
        id: node.id,
        x: node.x,
        y: node.y,
        ...(node.junctionRadius ===
        undefined
          ? {}
          : {
              junctionRadius:
                node.junctionRadius
            }),
        ...(node.regionId ===
        undefined
          ? {}
          : {
              regionId:
                node.regionId
            })
      });
    }

    for (
      const road
      of topologyDefinition.roads
    ) {
      topology.addRoad({
        id: road.id,
        from: road.from,
        to: road.to,
        ...(road.width === undefined
          ? {}
          : { width: road.width }),
        ...(road.surface === undefined
          ? {}
          : {
              surface: road.surface
            }),
        ...(road.bidirectional ===
        undefined
          ? {}
          : {
              bidirectional:
                road.bidirectional
            }),
        ...(road.enabled === undefined
          ? {}
          : {
              enabled: road.enabled
            }),
        ...(road.allowedProfiles ===
        undefined
          ? {}
          : {
              allowedProfiles:
                road.allowedProfiles
            }),
        ...(road.blockedProfiles ===
        undefined
          ? {}
          : {
              blockedProfiles:
                road.blockedProfiles
            }),
        ...(road.tags === undefined
          ? {}
          : { tags: road.tags })
      });
    }

    simulation.navigation
      .registerTopology(
        topologyDefinition.id,
        topology
      );

    topologies.set(
      topologyDefinition.id,
      topology
    );
  }

  for (
    const binding
    of definition.navigation.domains
  ) {
    if (
      !topologies.has(
        binding.topologyId
      )
    ) {
      throw new Error(
        `map ${definition.id} references unknown topology ${binding.topologyId}`
      );
    }

    simulation.navigation.bindDomain(
      binding.domainId,
      binding.topologyId
    );
  }

  for (
    const place
    of definition.places
  ) {
    simulation.places.createPlace(
      place
    );
  }

  for (
    const input
    of definition.resourceNodes
  ) {
    const navigation =
      simulation.navigation
        .navigationForDomain(
          input.location.domainId
        );

    if (!navigation) {
      throw new Error(
        `resource node ${input.id} references unbound domain ${input.location.domainId}`
      );
    }

    const navigationNode =
      navigation.nodes.get(
        input.location
          .navigationNodeId
      );

    if (!navigationNode) {
      throw new Error(
        `resource node ${input.id} references unknown navigation node ${input.location.navigationNodeId}`
      );
    }

    assertSamePosition(
      `resource node ${input.id}`,
      navigationNode.position,
      input.location.position
    );

    simulation.resources
      .createNode(input);
  }

  simulation.resources
    .assertInternalConsistency();
  simulation.places
    .assertInternalConsistency();
  simulation.world
    .assertInternalConsistency();
  simulation.navigation
    .assertInternalConsistency();

  return simulation;
}
