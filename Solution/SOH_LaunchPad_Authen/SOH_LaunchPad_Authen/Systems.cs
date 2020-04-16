using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SOH_LaunchPad_Authen
{
    public class Systems
    {
        public List<System> ListData;

        public Systems()
        {
            ListData = new List<System>();
        }

        public void AddNew(System s)
        {
            ListData.Add(s);
        }

        public void AddNew(string id, string name, string icon)
        {
            ListData.Add(new System() { Id = id, Name = name, Icon = icon });
        }
    }

    public class System
    {
        public string Id;
        public string Name;
        public string Icon;
    }
}