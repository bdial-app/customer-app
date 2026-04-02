import { Block } from "konsta/react";

const totalItems = 16;
const rows = 2;
const cols = Math.ceil(totalItems / rows);

const ServicesList = ({ className }: { className?: string }) => <Block className={`flex mb-0! flex-row gap-2 overflow-auto ${className}`}>
    {Array.from({ length: cols }).map((_, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-2">

            {Array.from({ length: rows }).map((_, rowIndex) => {
                const value = colIndex * rows + rowIndex + 1;

                if (value > totalItems) return null;

                return (
                    <div
                        key={rowIndex}
                        className="bg-slate-200 min-w-20 h-20 grid place-content-center rounded-lg"
                    >
                        <img src={"https://cdn-icons-png.flaticon.com/512/6165/6165574.png"} alt="" className="w-12 h-12" />
                        <p className="text-center">Clothes</p>
                    </div>
                );
            })}

        </div>
    ))}
</Block>

export default ServicesList