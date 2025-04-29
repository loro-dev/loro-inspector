import { Dropzone } from "./dropzone";

export default {
  title: "Components/DropZone",
  component: Dropzone,
  argTypes: {},
};

export const DropZone = () => <Dropzone onRead={(f) => console.log(f)} />;
