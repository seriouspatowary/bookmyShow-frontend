"use client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function UserDrawer({
  isOpen,
  onClose,
}: Props) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 bg-black/50 z-40
          transition-opacity duration-300 ease-out
          ${
            isOpen
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }
        `}
      />

      <div
  className={`
    fixed top-0 right-0
    h-screen w-[380px]
    bg-white z-50

    transition-transform
    duration-500
    ease-out

    ${
      isOpen
        ? "translate-x-0"
        : "translate-x-full"
    }
  `}
>
  



       <div className="border-b p-4">
          <div className="flex justify-between">

              <div>
                 <h2>
                    Hey!
                 </h2>

                 <button>
                    Edit Profile
                 </button>
              </div>

 
          </div>
       </div>



    </div>

      
    </>
  );
}