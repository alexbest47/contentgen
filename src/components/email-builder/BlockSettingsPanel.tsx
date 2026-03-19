import { type EmailBlock } from "./BlockCanvas";
import { type EmailBlockType, blockTypeLabels, isGeneratedBlock } from "./BlockLibrary";
import GeneratedBlockSettings from "./GeneratedBlockSettings";
import UserBlockSettings from "./UserBlockSettings";
import OfferCollectionSettings from "./OfferCollectionSettings";
import PaidProgramsCollectionSettings from "./PaidProgramsCollectionSettings";
import FreeCoursesGridSettings from "./FreeCoursesGridSettings";
import TestimonialCaseSelector from "./TestimonialCaseSelector";

interface Props {
  block: EmailBlock;
  colorSchemeId: string | null;
  onUpdateConfig: (blockId: string, config: Record<string, any>) => void;
  onGenerate: (blockId: string) => void;
  onGenerateImage: (blockId: string) => void;
  generating: boolean;
  generatingImage: boolean;
  userId: string;
  caseId?: string | null;
  onChangeCaseId?: (id: string | null) => void;
}

export default function BlockSettingsPanel({
  block, colorSchemeId, onUpdateConfig, onGenerate, onGenerateImage,
  generating, generatingImage, userId,
}: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">{blockTypeLabels[block.block_type]}</h3>

      {block.block_type === "paid_programs_collection" ? (
        <PaidProgramsCollectionSettings
          block={block}
          onUpdateConfig={(config) => onUpdateConfig(block.id, config)}
        />
      ) : block.block_type === "free_courses_grid" ? (
        <FreeCoursesGridSettings
          block={block}
          onUpdateConfig={(config) => onUpdateConfig(block.id, config)}
        />
      ) : block.block_type === "offer_collection" ? (
        <OfferCollectionSettings
          block={block}
          onUpdateConfig={(config) => onUpdateConfig(block.id, config)}
          onGenerate={() => onGenerate(block.id)}
          onGenerateImage={() => onGenerateImage(block.id)}
          generating={generating}
          generatingImage={generatingImage}
        />
      ) : isGeneratedBlock(block.block_type) ? (
        <GeneratedBlockSettings
          block={block}
          colorSchemeId={colorSchemeId}
          onUpdateConfig={(config) => onUpdateConfig(block.id, config)}
          onGenerate={() => onGenerate(block.id)}
          onGenerateImage={() => onGenerateImage(block.id)}
          generating={generating}
          generatingImage={generatingImage}
          userId={userId}
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
