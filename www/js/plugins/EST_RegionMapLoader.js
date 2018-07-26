/*:
@plugindesc This plugin is the MANAGER to swap event with building / decorations based on item.
<EST_REGIONMAPLOADER>
@author Estriole

@param DefaultUpdatingRegionMapTransition
@desc when updating region map. use this transitions.
0 -> black, 1->white, 2->none
@default 0

@help
 ■ Information      ╒══════════════════════════╛
 EST - RegionMapLoader
 Version: 1.1
 By Estriole
 File name: EST_RegionMapLoader.js

 ■ Introduction     ╒══════════════════════════╛
    Replace map data you mark with region with other map data.
 usefull if you want to transform part of the map...

 ■ Extra Credit     ╒══════════════════════════╛
 person other than me (Estriole) that you should credit in your project
 if you use this plugin

  - Formar => for part of the idea from his REGIONMAPLOADER from ACE.
              (i only reference some of the idea from his script. not all Idea is from his script)

 ■ Features         ╒══════════════════════════╛
 - mark your map with region then swap the data on it from other map

 ■ Changelog       ╒══════════════════════════╛
   v1.0 2015.11.16           Initial Release
   v1.1 2015.11.19      > Fix bug when copying / transforming / moving event using other build
                        and decor series plugin. the passability of hidden passage will revert back
                        to original map.

 ■ Plugin Download ╒══════════════════════════╛
  https://www.dropbox.com/s/5a9he4douzpbhjm/EST_RegionMapLoader.js?dl=0 

 ■ How to use       ╒══════════════════════════╛
 1) create your base map... (map you want to swap the data to)
 2) create your reference maps... it's better if it have the same size / layout with your first map.
    the map MUST have the coordinate you want to reference. ex: if you make base map coordinate [10,10]  
    replaced with reference map. the reference map MUST have [10,10] coordinate!!!!
 3) mark your first map (base map) with regions... example: region 21, 22, and 23.
    which you want the part to change to reference map.
 4) create your event which will change the region map data.
 using this:
 Plugin command:
    update_region_map regionId refMapId
      ex: update_region_map 21 7
      will replace region 21 data with map 7 data.
      ex: update_region_map 21 null
      will revert region 21 to default map data

 or Script Call:
    this.updateRegionMap(regionId,refMapId)
      ex: this.updateRegionMap(21,7)
      will replace region 21 data with map 7 data.
      ex: this.updateRegionMap(21,null)
      will revert region 21 to default map data
 
 5) AFTER you plugin command or script call from no. 4.
 you must call this to UPDATE your map (or else it won't be updated)
 Plugin command:
    process_update_region_map fadetype
    ex: process_update_region_map 2
    will update the region data and using transfer transition 2
    ex: process_update_region_map
    if you don't set parameter for fadetype. it will use what you set default on plugin parameter
    
 or Script Call:
    this.updatingRegionMap(fadetype)
    ex: this.updatingRegionMap(2)
    will update the region data and using transfer transition 2
    ex: this.updatingRegionMap()
    if you don't set parameter for fadetype. it will use what you set default on plugin parameter

 fadetype -> 0 = Black, 1 = White, 2 = No Fade.

 this updating is actually teleporting to same map with same coordinate.
 (so it 'might' not compatible with plugins which call common event on transfer
 since it might call that common event when calling this update method...)
 i might change this method later to actually erase tilemap and recreate tilemap.
 but for now this is sufficient.

 ■ Dependencies     ╒══════════════════════════╛
 None Known So Far...

 ■ Compatibility    ╒══════════════════════════╛
 I'm new in JS... and MV is new engine... so i cannot say for sure. 
 but it should be compatible with most things. 

 ■ Parameters       ╒══════════════════════════╛
  > DefaultUpdatingRegionMapTransition
  default: 0
  desc: when updating region map. use this transitions.
        0 -> black, 1->white, 2->none

 ■ License          ╒══════════════════════════╛
 Free to use in all project (except the one containing pornography)
 as long as i credited (ESTRIOLE). 

 ■ Support          ╒══════════════════════════╛
 While I'm flattered and I'm glad that people have been sharing and 
 asking support for scripts in other RPG Maker communities, I would 
 like to ask that you please avoid posting my scripts outside of where 
 I frequent because it would make finding support and fixing bugs 
 difficult for both of you and me.
   
 If you're ever looking for support, I can be reached at the following:
 [ http://forums.rpgmakerweb.com/ ]
 pm me : estriole

 ■ Author's Notes   ╒══════════════════════════╛
 Originally i want to Convert Formar Region Map Loader
 from ACE to MV. but i need to rewrite most of it because
 the difference between ACE and MV. so just credit him for
 part of the idea.

 This also part of EST - Decor And Build Series

*/
var EST = EST || {};
EST.RegionMapLoader = EST.RegionMapLoader || {};

EST.RegionMapLoader.param = $plugins.filter(function(p) { 
  return p.description.contains('<EST_REGIONMAPLOADER>'); })[0].parameters;

EST.RegionMapLoader.defTrans = EST.RegionMapLoader.param['DefaultUpdatingRegionMapTransition'];
EST.RegionMapLoader.defTrans = Number(EST.RegionMapLoader.defTrans);
if (isNaN(EST.RegionMapLoader.defTrans)) EST.RegionMapLoader.defTrans = 2;
if (EST.RegionMapLoader.defTrans > 2) EST.RegionMapLoader.defTrans = 2;

var est_regionmaploader_Game_System_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
  est_regionmaploader_Game_System_initialize.call(this);
  this._EstRegionMapData = {};
  this._EstCustomMapData = {};
};

Game_Interpreter.prototype.updateRegionMap = function(region, srcMapId) {
  var mapId = this._mapId;
  $gameSystem._EstCustomMapData[mapId] = $gameSystem._EstCustomMapData[mapId] || {};
  $gameSystem._EstCustomMapData[mapId][region] = srcMapId;
};

// Game_Interpreter.prototype.updateOtherRegionMap = function(mapId, region, srcMapId) {
//   $gameSystem._EstCustomMapData[mapId] = $gameSystem._EstCustomMapData[mapId] || {};
//   $gameSystem._EstCustomMapData[mapId][region] = srcMapId;
//   $gameSystem._EstRegionMapData[mapId] = null;
// };

// var est_regionmaploader_game_map_refresh = Game_Map.prototype.refresh;
// Game_Map.prototype.refresh = function() {
//   if(!$gameSystem._EstRegionMapData[this._mapId]) this.getRegionMapData(); 
//   est_regionmaploader_game_map_refresh.call(this);
// };

Game_Map.prototype.refreshRegionMap = function() {
  $gameSystem._EstRegionMapData[this._mapId] = null;
};

// actually it Transfer Player to same position with / without transition 
Game_Interpreter.prototype.updatingRegionMap = function(fade) {
  if(fade == undefined || fade == null || fade > 2) fade = EST.RegionMapLoader.defTrans;  
  var mapId = this._mapId;
  var x = $gamePlayer.x;
  var y = $gamePlayer.y;
  $gameMap.getRegionMapData();
  $gamePlayer.reserveTransfer(mapId, x, y, 0, fade);
};

var est_regionmaploader_game_map_tileid = Game_Map.prototype.tileId;
Game_Map.prototype.tileId = function(x, y, z) {
    var width = $dataMap.width;
    var height = $dataMap.height;
    if($gameSystem._EstRegionMapData[this._mapId]) 
      return $gameSystem._EstRegionMapData[this._mapId][(z * height + y) * width + x] || 0;
    return est_regionmaploader_game_map_tileid.call(this,x,y,z);
};

var est_regionmaploader_game_map_data = Game_Map.prototype.data;
Game_Map.prototype.data = function() {
  this.getRegionMapData();
  if ($gameSystem._EstRegionMapData[this._mapId]) return $gameSystem._EstRegionMapData[this._mapId];
  return est_regionmaploader_game_map_data.call(this);
};

Game_Map.prototype.getRegionMapData = function() {
  var mapId = this._mapId;
  var data = JsonEx.makeDeepCopy($dataMap.data);
  var changed = false;
  var width = this.width();
  var height = this.height();
  for (key in $gameSystem._EstCustomMapData[mapId])
  {
    if($gameSystem._EstCustomMapData[mapId][key])
    {
      $gameMap.get_map_data(Number($gameSystem._EstCustomMapData[mapId][key]), function(tmpdata){
        for (var x = 0; x < width; x++)
        {
          for (var y = 0; y < height; y++)
          {
            if($gameMap.regionId(x,y) == Number(key))
            {
              data[(0 * height + y) * width + x] = JsonEx.makeDeepCopy(tmpdata [(0 * height + y) * width + x]);
              data[(1 * height + y) * width + x] = JsonEx.makeDeepCopy(tmpdata [(1 * height + y) * width + x]);
              data[(2 * height + y) * width + x] = JsonEx.makeDeepCopy(tmpdata [(2 * height + y) * width + x]);
              data[(3 * height + y) * width + x] = JsonEx.makeDeepCopy(tmpdata [(3 * height + y) * width + x]);
              changed = true;
            }//end if this regionId(x,y)
          }//end for var y 
        }//end for var x                      
      });// end $gameMap.getmapdata
    }// end if game system [mapid][key]
  }//end for key
  if(changed) $gameSystem._EstRegionMapData[this._mapId] = data;
};

Game_Map.prototype.get_map_data = function(mapId, callback) {
  var variableName = '$Map%1'.format(mapId.padZero(3));
  var filename = 'data/Map%1.json'.format(mapId.padZero(3));
  var onError = undefined
  var onLoad = function(xhr, filePath, name) {
    if (xhr.status < 400) {
      window[name] = JSON.parse(xhr.responseText);
      DataManager.onLoad(window[name]);

        var variableName = '$Map%1'.format(mapId.padZero(3));
        if (window[variableName] === undefined || window[variableName] === null) return;
         var map = window[variableName].data;
        if (map === undefined) return;
         var mapData = JsonEx.makeDeepCopy(map);
        callback.call(this, mapData);
    }
  };

  if (window[variableName] === undefined || window[variableName] === null) {
      var xhr = new XMLHttpRequest();
      var name = '$' + filename.replace(/^.*(\\|\/|\:)/, '').replace(/\..*/, '');
      xhr.open('GET', filename);
      xhr.overrideMimeType('application/json');

    if(onLoad === undefined){
      onLoad = function(xhr, filename, name) {
        if (xhr.status < 400) {
          window[name] = JSON.parse(xhr.responseText);
          DataManager.onLoad(window[name]);
        }
      };
    }
    if(onError === undefined) {
      onError = function() {
        DataManager._errorUrl = DataManager._errorUrl || filename;
      };
    }
    xhr.onload = function() {
      onLoad.call(this, xhr, filename, name);
    };
    xhr.onerror = onError;
    window[name] = null;
    xhr.send();

   } else {
    var variableName = '$Map%1'.format(mapId.padZero(3));
     if (window[variableName] === undefined || window[variableName] === null) return;
     var map = window[variableName].data;
     if (map === undefined) return;
     var mapData = JsonEx.makeDeepCopy(map);
     callback.call(this, mapData);
   }  
};

//plugins command experimental
Game_Interpreter.prototype.PC_updateRegionMap = function(args) {
  var region = Number(args[0]);
  var srcMapId = args[1].toUpperCase() === "NULL" ? null : Number(args[1]);
  if (isNaN(region)||isNaN(srcMapId)) return window.alert("wrong updateRegionMap plugin command");
  this.updateRegionMap(region, srcMapId);
};

Game_Interpreter.prototype.PC_updatingRegionMap = function(args) {
  this.updatingRegionMap(args[0]);
};

var _PluginCommands = _PluginCommands || {};
_PluginCommands["UPDATE_REGION_MAP"] = Game_Interpreter.prototype.PC_updateRegionMap;
_PluginCommands["PROCESS_UPDATE_REGION_MAP"] = Game_Interpreter.prototype.PC_updatingRegionMap;

var est_regionmaploader_game_interpreter_plugincommand =
                      Game_Interpreter.prototype.pluginCommand;

// add my plugin command
var plugin_command = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    plugin_command.call(this, command, args);
    if(_PluginCommands[command.toUpperCase()]) return _PluginCommands[command.toUpperCase()].call(this,args);
    est_regionmaploader_game_interpreter_plugincommand.call(this, command, args);
};  
