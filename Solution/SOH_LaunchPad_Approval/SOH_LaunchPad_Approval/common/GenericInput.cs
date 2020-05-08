using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SOH_LaunchPad_Approval.common
{
    public class GenericInput
    {
        public List<Selection> Selection { get; set; }

        public string Get(string name)
        {
            foreach(var sel in Selection)
            {
                if (sel.Name == name)
                    return sel.Value;
            }

            return "";
        }
    }

    public class Selection
    {
        public string Name { get; set; }
        public string Value { get; set; }
    }

}