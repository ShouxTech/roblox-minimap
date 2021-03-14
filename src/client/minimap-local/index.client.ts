import { Players, RunService, Workspace } from '@rbxts/services';
import { MAP_STUD_SIZE_X, MAP_STUD_SIZE_Y } from './constants';
import { Marker } from './marker';

const DEFAULT_ZOOM = 0.12;
const ANCHOR_POINT_X = 0.5;
const ANCHOR_POINT_Y = 0.5;

const localPlayer = Players.LocalPlayer;
let rootPart: BasePart;

const mapGUI = (localPlayer.WaitForChild('PlayerGui') as PlayerGui).WaitForChild('MapGUI') as ScreenGui;
const mainFrame = mapGUI.WaitForChild('MainFrame') as Frame;
const mapImage = (mainFrame.WaitForChild('ClipFrame') as Frame).WaitForChild('MapImage') as Frame;
const playerFrame = mainFrame.WaitForChild('PlayerFrame') as Frame;

let zoom = DEFAULT_ZOOM;

const markers: Marker[] = [];
const markersFolder = Workspace.WaitForChild('MapMarkers') as Folder;

function lerp(start: number, goal: number, alpha: number) {
	return start + (goal - start) * alpha;
}

function addMarker(markerInstance: BasePart) {
    markers.push(new Marker(markerInstance));
}

function removeMarker(markerInstance: BasePart) {
    for (const [i, marker] of pairs(markers)) {
        if (marker.markerInstance === markerInstance) {
            markers.remove(i);
            marker.destroy();
        }
    }
}

function characterAdded(char?: Model) {
    if (!char) return;
    rootPart = char.WaitForChild('HumanoidRootPart') as BasePart;
}

characterAdded(localPlayer.Character);
localPlayer.CharacterAdded.Connect(characterAdded);

for (const markerInstance of markersFolder.GetChildren()) {
    addMarker(markerInstance as BasePart);
}

markersFolder.ChildAdded.Connect((child) => {
    if (child.IsA('BasePart')) {
        addMarker(child);
    }
});

markersFolder.ChildRemoved.Connect((child) => {
    if (child.IsA('BasePart')) {
        removeMarker(child);
    }
});

RunService.Heartbeat.Connect(() => {
    const playerCFrame = rootPart.CFrame;
    const playerPos = rootPart.Position;
    const lookVector = playerCFrame.LookVector;

    const velocity = rootPart.AssemblyLinearVelocity;
    const magnitude = new Vector3(velocity.X, 0, velocity.Z).Magnitude;
    const newZoom = DEFAULT_ZOOM / math.abs(1 - (magnitude / 320));
    zoom = lerp(zoom, newZoom, 0.1);

    const xSize = MAP_STUD_SIZE_X * zoom;
    const ySize = MAP_STUD_SIZE_Y * zoom;
    mapImage.Position = UDim2.fromScale((-playerPos.X / xSize) + ANCHOR_POINT_X, (-playerPos.Z / ySize) + ANCHOR_POINT_Y);
    mapImage.Size = UDim2.fromScale(1 / zoom, 1 / zoom);

    playerFrame.Rotation = math.deg(math.atan2(lookVector.X, -lookVector.Z)) - 90;

    for (const marker of markers) {
        marker.update(playerPos);
    }
});