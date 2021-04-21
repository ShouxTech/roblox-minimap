import { Players } from '@rbxts/services';
import { MAP_STUD_SIZE_X, MAP_STUD_SIZE_Y } from './constants';

const MAP_HALF_STUD_SIZE_X = MAP_STUD_SIZE_X / 2;
const MAP_HALF_STUD_SIZE_Y = MAP_STUD_SIZE_Y / 2;

const localPlayer = Players.LocalPlayer;

const mapGUI = (localPlayer.WaitForChild('PlayerGui') as PlayerGui).WaitForChild('MapGUI') as ScreenGui;
const mainFrame = mapGUI.WaitForChild('MainFrame') as Frame;
const clipFrame = mainFrame.WaitForChild('ClipFrame') as Frame;
const mapImage = clipFrame.WaitForChild('MapImage') as Frame;

const components = mapGUI.WaitForChild('Components') as Configuration;
const markerImagePrefab = components.WaitForChild('MarkerImage') as ImageLabel;
const MARKER_HALF_SIZE = markerImagePrefab.Size.X.Offset / 2;

function map(n: number, start: number, stop: number, newStart: number, newStop: number): number {
    const value = ((n - start) / (stop - start)) * (newStop - newStart) + newStart;

    if (newStart < newStop) {
        return math.clamp(value, newStart, newStop);
    } else {
        return math.clamp(value, newStop, newStart);
    }
}

export class Marker {
    public markerInstance: BasePart;
    private markerImage: ImageLabel;
    private maxViewDistance: number;
    private worldPosition: Vector2;

    constructor(markerInstance: BasePart) {
        let markerPosition = markerInstance.Position;

        const markerImage = markerImagePrefab.Clone();
        markerImage.Image = markerInstance.GetAttribute('Image') as string;
        markerImage.Parent = mapImage;

        this.markerInstance = markerInstance;
        this.markerImage = markerImage;
        this.maxViewDistance = markerInstance.GetAttribute('MaxViewDistance') as number;
        this.worldPosition = new Vector2(markerPosition.X, markerPosition.Z);

        markerInstance.GetPropertyChangedSignal('Position').Connect(() => {
            markerPosition = markerInstance.Position;
            this.worldPosition = new Vector2(markerPosition.X, markerPosition.Z);
        });
    }

    public update(playerPos: Vector3) {
        if (playerPos.sub(new Vector3(this.worldPosition.X, playerPos.Y, this.worldPosition.Y)).Magnitude > this.maxViewDistance) {
            this.markerImage.Visible = false;
            return;
        }

        const mapImageAbsolutePosition = mapImage.AbsolutePosition;
        const mapImageAbsoluteSize = mapImage.AbsoluteSize;

        const clipFrameAbsolutePosition = clipFrame.AbsolutePosition;
        const clipFrameAbsoluteSize = clipFrame.AbsoluteSize;

        let xPos = (map(this.worldPosition.X, -MAP_HALF_STUD_SIZE_X, MAP_HALF_STUD_SIZE_X, 0, 1));
        let yPos = (map(this.worldPosition.Y, -MAP_HALF_STUD_SIZE_Y, MAP_HALF_STUD_SIZE_Y, 0, 1));

        const markerImageAbsolutePosition = mapImageAbsolutePosition.add(new Vector2(mapImageAbsoluteSize.X * xPos, mapImageAbsoluteSize.Y * yPos));

        this.markerImage.Visible = true;

        if (markerImageAbsolutePosition.X - MARKER_HALF_SIZE < clipFrame.AbsolutePosition.X) { // If marker is not visible on left
            xPos = (-(mapImageAbsolutePosition.X - clipFrame.AbsolutePosition.X) + MARKER_HALF_SIZE) / mapImageAbsoluteSize.X;
        } else if ((markerImageAbsolutePosition.X + MARKER_HALF_SIZE) > clipFrameAbsolutePosition.X + clipFrameAbsoluteSize.X) { // If marker is not visible on right
            xPos = -((mapImageAbsolutePosition.X - (clipFrameAbsolutePosition.X + clipFrameAbsoluteSize.X)) + MARKER_HALF_SIZE) / mapImageAbsoluteSize.X;
        }

        if (markerImageAbsolutePosition.Y - MARKER_HALF_SIZE < clipFrame.AbsolutePosition.Y) { // If marker is not visible above
            yPos = -((mapImageAbsolutePosition.Y - clipFrameAbsolutePosition.Y) - MARKER_HALF_SIZE) / mapImageAbsoluteSize.Y;
        }
        if (markerImageAbsolutePosition.Y + MARKER_HALF_SIZE > clipFrame.AbsolutePosition.Y + clipFrame.AbsoluteSize.Y) { // If marker is not visible below
            yPos = -((mapImageAbsolutePosition.Y - (clipFrameAbsolutePosition.Y + clipFrameAbsoluteSize.Y)) + MARKER_HALF_SIZE) / mapImageAbsoluteSize.Y;
        }

        this.markerImage.Position = UDim2.fromScale(xPos, yPos);
    }

    public destroy() {
        this.markerImage.Destroy();
    }
}
