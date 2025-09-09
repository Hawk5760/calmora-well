import { SoulGarden } from "@/components/SoulGarden";

export const GardenPage = () => {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gradient-soul">
            Your Soul Garden
          </h1>
          <p className="text-lg text-muted-foreground">
            Watch your mindfulness journey bloom as you complete activities
          </p>
        </div>

        <SoulGarden />
      </div>
    </div>
  );
};