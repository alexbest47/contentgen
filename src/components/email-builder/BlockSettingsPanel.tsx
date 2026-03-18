import { type EmailBlock } from "./BlockCanvas";
import { type EmailBlockType, blockTypeLabels, isGeneratedBlock } from "./BlockLibrary";
import GeneratedBlockSettings from "./GeneratedBlockSettings";
import UserBlockSettings from "./UserBlockSettings";

interface Props {
  block: EmailBlock;
  colorSchemeId: string | null;
  onUpdateConfig: (blockId: string, config: Record<string, any>) => void;
  onGenerate: (blockId: string) => void;
  onGenerateImage: (blockId: string) => void;
  generating: boolean;
  generatingImage: boolean;
  userId: string;
}

export default function BlockSettingsPanel({
  block, colorSchemeId, onUpdateConfig, onGenerate, onGenerateImage,
  generating, generatingImage,
}: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">{blockTypeLabels[block.block_type]}</h3>

      {isGeneratedBlock(block.block_type) ? (
        <GeneratedBlockSettings
          block={block}
          colorSchemeId={colorSchemeId}
          onUpdateConfig={(config) => onUpdateConfig(block.id, config)}
          onGenerate={() => onGenerate(block.id)}
          onGenerateImage={() => onGenerateImage(block.id)}
          generating={generating}
          generatingImage={generatingImage}
        />
      ) : (
        <UserBlockSettings
          block={block}
          onUpdateConfig={(config) => onUpdateConfig(block.id, config)}
        />
      )}
    </div>
  );
}
