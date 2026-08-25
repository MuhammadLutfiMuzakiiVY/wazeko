export interface DeviceIdentity {
  name: string;
  os: string;
  clientVersion: [number, number, number];
  deviceId: number;
  registrationId: number;
}

export function defaultDeviceIdentity(): DeviceIdentity {
  return {
    name: "Wazeko Client",
    os: "Node.js / TypeScript",
    clientVersion: [2, 3000, 1015901307],
    deviceId: 0,
    registrationId: Math.floor(Math.random() * 65535),
  };
}
