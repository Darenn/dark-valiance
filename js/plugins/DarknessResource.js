//=============================================================================
// DarknessResource.js
//=============================================================================
var DkR = DkR || {};

/*:
 * @plugindesc Add the darkness resource to actors
 * @author Darenn Keller
 *
 * @help This plugin does not provide plugin commands.
 * 
 * ============================================================================
 * Notetags
 * ============================================================================
 * 
 * Actor :
 * <DpMax: x>
 * 
 * Skill :
 * <DpGain: x>
 * <DpCost: x>
 * 
 * =============================================================================
 * @param DP Icon
 * @parent ---DP visuals---
 * @type number
 * @min 0
 * @desc Choose what icon to use to represent DP costs.
 * Use 0 if you wish to not use an icon.
 * @default 302
 * 
 * @param DP Format
 * @parent ---DP visuals---
 * @desc Adjusts the way DP cost appears in the skill list window.
 * %1 - Cost     %2 - DP
 * @default %1%2
 *
 * @param DP Font Size
 * @parent ---DP visuals---
 * @type number
 * @min 1
 * @desc Adjusts the font size used to display DP.
 * Default: 20
 * @default 20
 *
 * @param DP Text Color
 * @parent ---DP visuals---
 * @type number
 * @min 0
 * @max 31
 * @desc Adjusts the text color used from the Window skin for TP.
 * Default: 30
 * @default 30
 *
 */

(function() {

    'use strict';

    TextManager.dp = "DP";
    TextManager.dpA = "DP";

    DkR.Parameters = PluginManager.parameters('DarknessResource');
    DkR.DpIcon = Number(DkR.Parameters['DP Icon']);
    DkR.DpFormat = String(DkR.Parameters['DP Format']);
    DkR.DpFontSize = Number(DkR.Parameters['DP Font Size']);
    DkR.DpTextColor = Number(DkR.Parameters['DP Text Color']); 
//-----------------------------------------------------------------------------
// DataManager
//-----------------------------------------------------------------------------

let notetagsLoaded = false;
const _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if(!_DataManager_isDatabaseLoaded.apply(this, arguments)) return false;
    if(!notetagsLoaded) {
        loadNotetags();
        notetagsLoaded = true;
    }
    return true;
};

var loadNotetags = function() {
    for(let i = 0; i < $dataActors.length; i++) {
        let actor = $dataActors[i];
        if (actor) {
            actor.Dp = 0;
            actor.MaxDp = 0; 
            if (actor.meta.MaxDp) {               
                actor.MaxDp = Number(actor.meta.MaxDp);
            }
            if (actor.meta.StartingDp) {
                actor.Dp = Number(actor.meta.StartingDp);
            }
        }
    }
    for(var i = 0; i < $dataSkills.length; i++) {
        let skill = $dataSkills[i];
        if (skill) {
            skill.DpGain = 0;
            skill.DpCost = 0;
            if (skill.meta.DpGain) {
                skill.DpGain = Number(skill.meta.DpGain);
            }
            if (skill.meta.DpCost) {
                skill.DpCost = Number(skill.meta.DpCost);
            }
        }
    }
}

var _Game_Actor_prototype_setup = Game_Actor.prototype.setup;
Game_Actor.prototype.setup = function(actorId) {
    _Game_Actor_prototype_setup.call(this, actorId);
    var actor = $dataActors[actorId];
    this.Dp = actor.Dp;
    this.MaxDp = actor.MaxDp;
};

//-----------------------------------------------------------------------------
// Game_Battler
//-----------------------------------------------------------------------------

var Game_BattlerBase_paySkillCost = Game_BattlerBase.prototype.paySkillCost;
Game_BattlerBase.prototype.paySkillCost = function(skill) {
    Game_BattlerBase_paySkillCost.call(this, skill);
    this.gainSkillDpGain(skill);
};

Game_BattlerBase.prototype.gainSkillDpGain = function(skill) {
    this.Dp += skill.DpGain;
}

Game_BattlerBase.prototype.hasEnoughDP = function(skill) {
    return this.Dp >= skill.DpCost;
}

DkR.Game_BattlerBase_canPaySkillCost =
    Game_BattlerBase.prototype.canPaySkillCost;
Game_BattlerBase.prototype.canPaySkillCost = function(skill) {
    if (this.MaxDp > 0 && !this.hasEnoughDP(skill)) return false;
    return DkR.Game_BattlerBase_canPaySkillCost.call(this, skill);
};

//-----------------------------------------------------------------------------
// Window
//-----------------------------------------------------------------------------

Window_Base.prototype.drawActorDp = function(actor, x, y, width) {
    width = width || 186;
    var color1 = "purple";
    var color2 = "purple";
    this.draw
    this.drawGauge(x, y, width, actor.Dp / actor.MaxDp, color1, color2);
    this.changeTextColor(this.systemColor());
    this.drawText("DP", x, y, 44);
    this.drawCurrentAndMax(actor.Dp, actor.MaxDp, x, y, width,
                            this.mpColor(actor), this.normalColor());
};

Window_Base.prototype.drawActorSimpleStatus = function(actor, x, y, width) {
    var lineHeight = this.lineHeight();
    var x2 = x + 180;
    var width2 = Math.min(200, width - 180 - this.textPadding());
    this.drawActorName(actor, x, y);
    this.drawActorLevel(actor, x, y + lineHeight * 1);
    this.drawActorIcons(actor, x, y + lineHeight * 2);
    this.drawActorClass(actor, x2, y);
    this.drawActorHp(actor, x2, y + lineHeight * 1, width2);
    if (actor.MaxDp > 0) {
        this.drawActorDp(actor, x2, y + lineHeight * 2, width2);
    }
    else {
        this.drawActorMp(actor, x2, y + lineHeight * 2, width2);
    }
};


// To keep for compatibility without YanFly BattleStatus
Window_BattleStatus.prototype.drawGaugeAreaWithTp = function(rect, actor) {
    this.drawActorHp(actor, rect.x + 0, rect.y, 108);
    if (actor.MaxDp > 0) {
        this.drawActorDp(actor, rect.x + 123, rect.y, 96);
    }
    else {
        this.drawActorMp(actor, rect.x + 123, rect.y, 96);
    }
};

Window_BattleStatus.prototype.drawGaugeArea = function(rect, actor) {
    this.contents.fontSize = Yanfly.Param.BSWParamFontSize;
    this._enableYBuffer = true;
    var wy = rect.y + rect.height - this.lineHeight();
    var wymod = (Imported.YEP_CoreEngine) ? Yanfly.Param.GaugeHeight : 6;
    var wymod = Math.max(16, wymod);
    this.drawActorHp(actor, rect.x, wy - wymod, rect.width);
    if (actor.MaxDp > 0) {
        this.drawActorDp(actor, rect.x, wy, rect.width);
    } else {
        this.drawActorMp(actor, rect.x, wy, rect.width);
    }
    this._enableYBuffer = false;
};

/*Window_SkillList.prototype.drawSkillCost = function(skill, x, y, width) {
    if (this._actor.skillTpCost(skill) > 0) {
        this.changeTextColor(this.tpCostColor());
        this.drawText(this._actor.skillTpCost(skill), x, y, width, 'right');
    } else if (this._actor.skillMpCost(skill) > 0) {
        this.changeTextColor(this.mpCostColor());
        this.drawText(this._actor.skillMpCost(skill), x, y, width, 'right');
    } else if (skill.DpGain > 0) {
        this.changeTextColor("purple");
        this.drawText(skill.DpGain, x, y, width, 'right');
    }
};*/

var _Window_SkillList_drawOtherCost = Window_SkillList.prototype.drawOtherCost;
Window_SkillList.prototype.drawOtherCost = function(skill, wx, wy, dw) {
    dw = _Window_SkillList_drawOtherCost.call(this, skill, wx, wy, dw);
    if (skill.DpCost <= 0) return dw;
    if (DkR.DpIcon > 0) {
      var iw = wx + dw - Window_Base._iconWidth;
      this.drawIcon(DkR.DpIcon, iw, wy + 2);
      dw -= Window_Base._iconWidth + 2;
    }
    this.changeTextColor(this.textColor(DkR.DpTextColor));
    var fmt = DkR.DpFormat;
    var text = fmt.format(Yanfly.Util.toGroup(skill.DpCost),
      TextManager.dpA);
    this.contents.fontSize = DkR.DpFontSize;
    this.drawText(text, wx, wy, dw, 'right');
    var returnWidth = dw - this.textWidth(text) - Yanfly.Param.SCCCostPadding;
    this.resetFontSettings();
    return returnWidth;
};


})();