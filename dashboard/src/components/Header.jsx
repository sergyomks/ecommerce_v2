import React from "react";
import { useDispatch, useSelector } from "react-redux";
import avatar from "../assets/avatar.jpg";
import { Menu } from "lucide-react";
import { toggleNavbar } from "../store/slices/extraSlice";

const Header = () => {
  const { user } = useSelector(state => state.auth);
  const { openedComponent } = useSelector((state) => state.extra);
  const dispatch = useDispatch();
  return <>
    <header className="flex justify-between mb-3 pb-2">
      <p className="flex items-center gap-3 text-sm font-medium">
        <span className="text-gray-500">
          Hola, {user?.nombre}
        </span>
        <span>/</span>
        <span>{openedComponent}</span>
      </p>
      <div className="flex gap-3 items-center">
        <Menu className="block md:hidden" onClick={() => dispatch(toggleNavbar())} />
        <img src={user?.imagen?.url || avatar} alt={user?.nombre || avatar}
          className="w-14 h-14 rounded-full object-cover" />
      </div>
    </header>
  </>;
};

export default Header;
