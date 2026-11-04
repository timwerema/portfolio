export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-[#0b5fcf] text-xs font-bold tracking-wide text-white">
                TW
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-semibold">Timasi Werema</span>
                <span className="text-muted-foreground truncate text-xs">Studio dashboard</span>
            </div>
        </>
    );
}
