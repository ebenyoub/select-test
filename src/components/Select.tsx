import { useCallback, useEffect, useRef, useState } from "react";
import CaretDown from "../iconComponents/CaretDown";
import style from "../styles/select.module.css";
import UseFetch from "../utils/UseFetch";

type SingleSelectProps = {
  multiple?: false;
}

type MultiSelectProps = {
  multiple: true;
}

type SelectProps = SingleSelectProps | MultiSelectProps;

function Select({ multiple }: SelectProps) {
  const limit = 20;
  const [skip, setSkip] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState<string | string[]>(multiple ? [] : "");
  const [highLightedIndex, setHighLightedIndex] = useState(0);
  
  const { data, loading, error, success, hasMore } = UseFetch(skip, limit);
  const observer = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const lastElementRef = useCallback((node: HTMLLIElement) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setSkip(prev => prev + limit)
      }
    })
    if (node) observer.current.observe(node);
  }, [loading, hasMore])

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  }

  const selectUser = useCallback((user: string) => {
    setValue(prev => {
      if (multiple) {
        if (Array.isArray(prev)) {
          if (value.includes(user)) {
            return prev.filter(u => u !== user); // désélectionner l'item
          } else {
            return [...prev, user];
          }
        } else {
          return [user];
        }
      } else {
        return user;
      }
    });

    setIsOpen(false);
  }, [multiple, value]);

  const clearItem = (user: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setValue(prev => {
      if (Array.isArray(prev)) {
        return prev.filter(u => u !== user)
      } else {
        return prev;
      }
    })
  }

  const clearAllItems = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(prev => {
      if (Array.isArray(prev)) {
        return [];
      } else {
        return "";
      }
    })
  }

  const handleBackspace = (e: React.KeyboardEvent, user: string) => {
    if (e.code === "Backspace" || e.code === "Enter") {
      e.preventDefault();
      clearItem(user, e);
    }
  }

  const selectedItems = (items: string[] | string) => {
    if (typeof items === "string") {
      return <span className={style.value}>{items}</span>
    } else {
      return items.map((user, index) => {
        return (
          <div 
            className={style["input-item"]}
            tabIndex={0}
            key={index}
            onClick={e => clearItem(user, e)}
            onKeyDown={e => handleBackspace(e, user)}
          >
            <span>{user}</span>
            <span className={style["clear-item"]}>&times;</span>
          </div>
        )
      })
    }
  }

  useEffect(() => {
    const container = containerRef.current;
    const handler = (e: KeyboardEvent) => {
      if (e.target != container) return;
      switch (e.code) {
        case "Enter":
        case "Space":
          setIsOpen(prev => !prev);
          if (isOpen && data[highLightedIndex]) {
            selectUser(`${data[highLightedIndex]}`)
          }
          break;

        case "ArrowUp":
        case "ArrowDown": {
          if (!isOpen) {
            setIsOpen(true);
            break;
          }
          let dir = 0;
          if (e.code === "ArrowDown") dir = 1;
          if (e.code === "ArrowUp") dir = -1;
          const newIndex = highLightedIndex + dir;
          if (newIndex >= 0 && newIndex < data.length) {
            setHighLightedIndex(newIndex)
            const optionsContainer = container?.querySelector(`.${style.options}`);
            const highlightedElement = optionsContainer?.querySelector(`.${style.option}:nth-child(${newIndex + 1})`);
            highlightedElement?.scrollIntoView({ block: "nearest" });
          }
          break;
        }

        case "Escape":
          setIsOpen(false)
          break;

        default:
          break;
      }
    }
    container?.addEventListener("keydown", handler)
    return () => { container?.removeEventListener("keydown", handler) }
  }, [isOpen, highLightedIndex, data, selectUser])
  
  return (
    <div className={style.container}>
      <form>
        <label htmlFor="input-list">Selection à choix {multiple ? "multiple" : "unique"}</label>
        <div
          className={style["input-list"]}
          id="input-list"
          tabIndex={0}
          onClick={toggleDropdown}
          onBlur={() => setIsOpen(false)}
          ref={containerRef}
        >
          {value.length ? selectedItems(value) : "Séléctionnez un utilisateur"}
          {multiple && value.length > 0 && <span className={style["clear-all"]} onClick={e => clearAllItems(e)}>&times;</span>}
          <CaretDown className={`${style.caret} ${isOpen && style.open}`} width="20" />
          <ul className={`${style.options} ${isOpen && style.show}`}>
            {success && data.map((user, index) => {
              return (
                <li
                  className={`${style.option} ${value?.includes(user) && style.selected} ${index === highLightedIndex ? style.highlighted : ''}`}
                  onMouseEnter={() => setHighLightedIndex(index)}
                  key={`${user}`}
                  onClick={() => selectUser(user)}
                  ref={data.length === index + 1 ? lastElementRef : null}
                  data-name={user}
                >
                  {user}
                </li>
              );
            })}
            <span>{loading && "Loading..."}</span>
            <span>{error && error.message}</span>
          </ul>
        </div>
      </form >
    </div >
  )
}

export default Select; 