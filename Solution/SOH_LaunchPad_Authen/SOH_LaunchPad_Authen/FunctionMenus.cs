using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SOH_LaunchPad_Authen
{
    public class FunctionMenus
    {
        public List<SysFunction> Functions;

        public FunctionMenus()
        {
            Functions = new List<SysFunction>();
        }

        public void addNew(SysFunction func)
        {
            if(string.IsNullOrEmpty(func.ParentId))
            {
                var foundFunc = Functions.FindAll(f => f.ParentId == func.FuncID);
                foreach(var subfunc in foundFunc)
                {
                    func.AddChild(subfunc);
                    Functions.Remove(subfunc);
                }

                Functions.Add(func);
            }
            else
            {
                var foundFunc = Functions.Find(f => f.FuncID == func.ParentId);
                if(foundFunc != null)
                {
                    foundFunc.AddChild(func);
                }
                else
                {
                    Functions.Add(func);
                }
            }
        }

        public void Sort()
        {
            Functions = Functions.OrderBy(x => x.Sort).ToList();
        }
    }

    public class SysFunction
    {
        public string FuncID;
        public string FuncName;
        public string FuncIcon;
        public int Sort;
        public string FuncParas;
        public string ParentId;
        public string Uri;

        public List<SysFunction> childFunctions;

        public SysFunction()
        {
            childFunctions = new List<SysFunction>();
        }

        public void AddChild(SysFunction func)
        {
            childFunctions.Add(func);
            childFunctions = childFunctions.OrderBy(x => x.Sort).ToList();
        }
    }
}